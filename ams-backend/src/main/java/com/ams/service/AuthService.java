package com.ams.service;

import com.ams.dto.AuthDTO;
import com.ams.entity.Role;
import com.ams.entity.User;
import com.ams.entity.UserRole;
import com.ams.exception.BadRequestException;
import com.ams.exception.DuplicateResourceException;
import com.ams.repository.RoleRepository;
import com.ams.repository.UserRepository;
import com.ams.repository.UserRoleRepository;
import com.ams.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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

    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        String token = tokenProvider.generateToken(authentication);
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadRequestException("User not found"));

        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        auditLogService.log("LOGIN", "User", user.getUsername());

        return new AuthDTO.AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                roles
        );
    }

    @Transactional
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username '" + request.username() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email '" + request.email() + "' is already in use");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .accountStatus(User.AccountStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        Role studentRole = roleRepository.findByRoleName(Role.RoleName.STUDENT)
                .orElseThrow(() -> new BadRequestException("STUDENT role not found in system"));

        UserRole userRole = UserRole.builder()
                .user(user)
                .role(studentRole)
                .assignmentStatus(UserRole.AssignmentStatus.ACTIVE)
                .assignmentNote("Default registration role")
                .build();
        userRoleRepository.save(userRole);

        auditLogService.log("REGISTER", "User", user.getUsername());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        String token = tokenProvider.generateToken(authentication);

        return new AuthDTO.AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                List.of("ROLE_STUDENT")
        );
    }
}
