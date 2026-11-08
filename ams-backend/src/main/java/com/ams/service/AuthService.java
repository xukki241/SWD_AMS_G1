package com.ams.service;

import com.ams.dto.AuthDTO;
import com.ams.entity.AuthToken;
import com.ams.entity.Role;
import com.ams.entity.User;
import com.ams.entity.UserRole;
import com.ams.exception.BadRequestException;
import com.ams.exception.DuplicateResourceException;
import com.ams.repository.RoleRepository;
import com.ams.repository.UserRepository;
import com.ams.repository.UserRoleRepository;
import com.ams.security.FirebaseTokenVerifier;
import com.ams.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final AuthTokenService authTokenService;
    private final EmailDeliveryService emailDeliveryService;
    private final ObjectMapper objectMapper;
    private final FirebaseTokenVerifier firebaseTokenVerifier;

    @Value("${app.google.client-id:}") private String googleClientId;

    @Transactional
    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        String identifier = request.identifier().trim();
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier, identifier).orElse(null);
        if (user != null && !user.isEmailVerified()) {
            throw new BadRequestException("Please verify your email before signing in");
        }
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, request.password()));
        } catch (BadCredentialsException ex) {
            if (user != null && user.getAccountStatus() == User.AccountStatus.ACTIVE) {
                int attempts = user.getFailedLoginAttempts() + 1;
                user.setFailedLoginAttempts(attempts);
                if (attempts >= 3) user.setAccountStatus(User.AccountStatus.SUSPENDED);
                userRepository.save(user);
            }
            throw new BadRequestException("Invalid email/username or password");
        }
        if (user == null) throw new BadRequestException("Invalid email/username or password");
        if (user.getFailedLoginAttempts() != 0) {
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
        }
        auditLogService.log("LOGIN", "User", user.getUsername());
        return issueSession(user);
    }

    @Transactional
    public AuthDTO.RegisterResponse register(AuthDTO.RegisterRequest request) {
        validatePassword(request.password());
        if (userRepository.existsByUsername(request.username())) throw new DuplicateResourceException("Username is already taken");
        if (userRepository.existsByEmail(request.email())) throw new DuplicateResourceException("Email is already in use");
        // No role yet — user picks Student/Teacher on first sign-in (/choose-role).
        User user = userRepository.save(User.builder()
                .username(request.username().trim())
                .email(request.email().trim().toLowerCase(Locale.ROOT))
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .emailVerified(false)
                .accountStatus(User.AccountStatus.ACTIVE)
                .onboardingCompleted(false)
                .build());
        String token = authTokenService.issue(user, AuthToken.TokenType.VERIFY_EMAIL, 24 * 60);
        emailDeliveryService.sendVerification(user.getEmail(), token);
        auditLogService.log("REGISTER_PENDING_VERIFICATION", "User", user.getUsername());
        return new AuthDTO.RegisterResponse("Check your email to verify your account", user.getEmail());
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = authTokenService.consume(token, AuthToken.TokenType.VERIFY_EMAIL);
        user.setEmailVerified(true);
        userRepository.save(user);
        auditLogService.log("VERIFY_EMAIL", "User", user.getUsername());
    }

    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT)).ifPresent(user -> {
            String token = authTokenService.issue(user, AuthToken.TokenType.RESET_PASSWORD, 30);
            emailDeliveryService.sendPasswordReset(user.getEmail(), token);
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        validatePassword(newPassword);
        User user = authTokenService.consume(token, AuthToken.TokenType.RESET_PASSWORD);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setFailedLoginAttempts(0);
        userRepository.save(user);
        auditLogService.log("RESET_PASSWORD", "User", user.getUsername());
    }

    @Transactional
    public AuthDTO.AuthResponse loginWithGoogle(String idToken) {
        GoogleIdentity identity = resolveGoogleIdentity(idToken);
        if (identity.email().isBlank() || !identity.emailVerified()) {
            throw new BadRequestException("Google account must have a verified email");
        }
        User user = userRepository.findByEmail(identity.email())
                .orElseGet(() -> createGoogleUser(identity.email(), identity.fullName()));
        if (user.getAccountStatus() != User.AccountStatus.ACTIVE) {
            throw new BadRequestException("Account is locked or inactive; contact an administrator");
        }
        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }
        auditLogService.log("LOGIN_GOOGLE", "User", user.getUsername());
        return issueSession(user);
    }

    /**
     * First-time role pick (exclusive): STUDENT = join only; TEACHER = create/manage only.
     */
    @Transactional
    public AuthDTO.AuthResponse chooseRole(AuthDTO.ChooseRoleRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("User not found"));
        if (user.isOnboardingCompleted()) {
            throw new BadRequestException("Role was already selected");
        }
        String raw = request.role() == null ? "" : request.role().trim().toUpperCase(Locale.ROOT);
        if (raw.startsWith("ROLE_")) raw = raw.substring(5);
        if (!raw.equals("STUDENT") && !raw.equals("TEACHER")) {
            throw new BadRequestException("Role must be STUDENT or TEACHER");
        }

        // Clear any provisional roles from older flows.
        for (UserRole ur : userRoleRepository.findByUser(user)) {
            if (ur.getAssignmentStatus() == UserRole.AssignmentStatus.ACTIVE) {
                ur.setAssignmentStatus(UserRole.AssignmentStatus.REVOKED);
                ur.setAssignmentNote("Replaced by first-login role choice");
                userRoleRepository.save(ur);
            }
        }

        Role.RoleName chosen = raw.equals("TEACHER") ? Role.RoleName.TEACHER : Role.RoleName.STUDENT;
        Role role = roleRepository.findByRoleName(chosen)
                .orElseThrow(() -> new BadRequestException(chosen.name() + " role not found in system"));
        userRoleRepository.save(UserRole.builder().user(user).role(role)
                .assignmentStatus(UserRole.AssignmentStatus.ACTIVE)
                .assignmentNote(chosen == Role.RoleName.TEACHER
                        ? "Onboarding: teacher (create & manage courses)"
                        : "Onboarding: student (join courses only)")
                .build());

        user.setOnboardingCompleted(true);
        userRepository.save(user);
        auditLogService.log("CHOOSE_ROLE", "User", user.getUsername() + " -> " + raw);
        return issueSession(user);
    }

    private record GoogleIdentity(String email, String fullName, boolean emailVerified) {}

    private GoogleIdentity resolveGoogleIdentity(String idToken) {
        boolean googleConfigured = googleClientId != null && !googleClientId.isBlank();
        boolean firebaseConfigured = firebaseTokenVerifier.isConfigured();
        if (!googleConfigured && !firebaseConfigured) {
            throw new BadRequestException("Google sign-in is not configured");
        }
        BadRequestException last = null;
        if (googleConfigured) {
            try {
                JsonNode claims = verifyGoogleToken(idToken);
                String email = claims.path("email").asText("").toLowerCase(Locale.ROOT);
                return new GoogleIdentity(email, claims.path("name").asText(email), claims.path("email_verified").asBoolean(false));
            } catch (BadRequestException ex) {
                last = ex;
            }
        }
        if (firebaseConfigured) {
            try {
                FirebaseTokenVerifier.VerifiedFirebaseUser fb = firebaseTokenVerifier.verify(idToken);
                return new GoogleIdentity(fb.email(), fb.fullName(), fb.emailVerified());
            } catch (BadRequestException ex) {
                last = ex;
            }
        }
        throw last != null ? last : new BadRequestException("Google credential is invalid");
    }

    private User createGoogleUser(String email, String fullName) {
        String base = email.substring(0, email.indexOf('@')).toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_.-]", "_");
        if (base.length() > 42) base = base.substring(0, 42);
        String username = base;
        while (userRepository.existsByUsername(username)) username = base + UUID.randomUUID().toString().substring(0, 6);
        return userRepository.save(User.builder().username(username).email(email)
                .password(passwordEncoder.encode(UUID.randomUUID() + "A1!")).fullName(fullName)
                .emailVerified(true).accountStatus(User.AccountStatus.ACTIVE)
                .onboardingCompleted(false).build());
    }

    private JsonNode verifyGoogleToken(String idToken) {
        try {
            String encoded = URLEncoder.encode(idToken, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + encoded))
                    .timeout(Duration.ofSeconds(8)).GET().build();
            HttpResponse<String> result = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode claims = objectMapper.readTree(result.body());
            if (result.statusCode() != 200 || !googleClientId.equals(claims.path("aud").asText())) {
                throw new BadRequestException("Google credential is invalid");
            }
            return claims;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("Could not verify Google sign-in");
        }
    }

    @Transactional(readOnly = true)
    public AuthDTO.AuthResponse refreshSession() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("User not found"));
        if (user.getAccountStatus() != User.AccountStatus.ACTIVE) {
            throw new BadRequestException("Account is locked or inactive; contact an administrator");
        }
        return issueSession(user);
    }

    private AuthDTO.AuthResponse issueSession(User user) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>(
                userRoleRepository.findActiveRolesByUserId(user.getId()).stream()
                        .map(ur -> new SimpleGrantedAuthority("ROLE_" + ur.getRole().getRoleName().name()))
                        .toList());
        // Spring Security User.builder rejects empty authorities — provisional until /choose-role.
        if (authorities.isEmpty()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ONBOARDING"));
        }
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(), null, authorities);
        List<String> roles = authorities.stream().map(SimpleGrantedAuthority::getAuthority).toList();
        return response(user, tokenProvider.generateToken(authentication), roles);
    }

    private AuthDTO.AuthResponse response(User user, String token, List<String> roles) {
        return new AuthDTO.AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                roles,
                user.isOnboardingCompleted());
    }

    private void validatePassword(String password) {
        if (password.length() < 10 || !password.matches(".*[A-Z].*") || !password.matches(".*[a-z].*")
                || !password.matches(".*\\d.*") || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new BadRequestException("Password must be at least 10 characters and include upper/lowercase letters, a number, and a symbol");
        }
    }
}
