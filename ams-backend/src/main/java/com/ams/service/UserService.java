package com.ams.service;

import com.ams.dto.UserDTO;
import com.ams.entity.Role;
import com.ams.entity.User;
import com.ams.entity.UserRole;
import com.ams.exception.BadRequestException;
import com.ams.exception.DuplicateResourceException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.RoleRepository;
import com.ams.repository.UserRepository;
import com.ams.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileUploadService fileUploadService;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<UserDTO.UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDTO.UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToResponse(user);
    }

    @Transactional
    public UserDTO.UserResponse createUser(UserDTO.CreateUserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username already exists");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email already exists");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .accountStatus(User.AccountStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        if (request.roles() != null && !request.roles().isEmpty()) {
            for (String roleStr : request.roles()) {
                String cleanRole = roleStr.replace("ROLE_", "");
                try {
                    Role.RoleName rName = Role.RoleName.valueOf(cleanRole);
                    Role role = roleRepository.findByRoleName(rName)
                            .orElseThrow(() -> new BadRequestException("Role not found: " + cleanRole));
                    UserRole ur = UserRole.builder()
                            .user(user)
                            .role(role)
                            .assignmentStatus(UserRole.AssignmentStatus.ACTIVE)
                            .build();
                    userRoleRepository.save(ur);
                } catch (IllegalArgumentException e) {
                    throw new BadRequestException("Invalid role: " + cleanRole);
                }
            }
        }

        auditLogService.log("CREATE_USER", "User", user.getUsername());
        return mapToResponse(user);
    }

    @Transactional
    public UserDTO.UserResponse updateUser(Long id, UserDTO.UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName());
        }
        if (request.accountStatus() != null) {
            user.setAccountStatus(request.accountStatus());
            if (request.accountStatus() == User.AccountStatus.ACTIVE) user.setFailedLoginAttempts(0);
        }

        user = userRepository.save(user);
        auditLogService.log("UPDATE_USER", "User", user.getUsername());
        return mapToResponse(user);
    }

    @Transactional(readOnly = true)
    public UserDTO.ProfileResponse getMyProfile() {
        return mapProfile(currentUser());
    }

    @Transactional
    public UserDTO.ProfileResponse updateMyProfile(UserDTO.UpdateProfileRequest request) {
        User user = currentUser();
        user.setFullName(request.fullName().trim());
        return mapProfile(userRepository.save(user));
    }

    @Transactional
    public UserDTO.ProfileResponse uploadMyAvatar(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty() || file.getSize() > 5L * 1024 * 1024
                || file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new BadRequestException("Avatar must be an image no larger than 5 MB");
        }
        Map<?, ?> result = fileUploadService.uploadFile(file, "avatars");
        User user = currentUser();
        user.setAvatarUrl((String) result.get("secure_url"));
        return mapProfile(userRepository.save(user));
    }

    @Transactional
    public void changeMyPassword(UserDTO.ChangePasswordRequest request) {
        User user = currentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        validateStrongPassword(request.newPassword());
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        auditLogService.log("CHANGE_PASSWORD", "User", user.getUsername());
    }

    @Transactional
    public UserDTO.UserResponse unlockUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setFailedLoginAttempts(0);
        user.setAccountStatus(User.AccountStatus.ACTIVE);
        user = userRepository.save(user);
        auditLogService.log("UNLOCK_USER", "User", user.getUsername());
        return mapToResponse(user);
    }

    private UserDTO.ProfileResponse mapProfile(User user) {
        return new UserDTO.ProfileResponse(user.getId(), user.getUsername(), user.getEmail(), user.getFullName(), user.getAvatarUrl());
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private void validateStrongPassword(String password) {
        if (password == null || password.length() < 10 || !password.matches(".*[A-Z].*")
                || !password.matches(".*[a-z].*") || !password.matches(".*\\d.*")
                || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new BadRequestException("Password must be at least 10 characters and include upper/lowercase letters, a number, and a symbol");
        }
    }

    @Transactional
    public UserDTO.UserResponse assignRole(Long userId, UserDTO.AssignRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String cleanRole = request.roleName().replace("ROLE_", "");
        Role.RoleName rName = Role.RoleName.valueOf(cleanRole);
        Role role = roleRepository.findByRoleName(rName)
                .orElseThrow(() -> new BadRequestException("Role not found: " + cleanRole));

        // Exclusive Student ↔ Teacher: assigning one revokes the other.
        if (rName == Role.RoleName.TEACHER || rName == Role.RoleName.STUDENT) {
            Role.RoleName opposite = rName == Role.RoleName.TEACHER
                    ? Role.RoleName.STUDENT : Role.RoleName.TEACHER;
            for (UserRole existing : userRoleRepository.findByUser(user)) {
                if (existing.getAssignmentStatus() == UserRole.AssignmentStatus.ACTIVE
                        && existing.getRole().getRoleName() == opposite) {
                    existing.setAssignmentStatus(UserRole.AssignmentStatus.REVOKED);
                    existing.setAssignmentNote("Exclusive roles: revoked when assigning " + cleanRole);
                    userRoleRepository.save(existing);
                }
            }
        }

        UserRole ur = UserRole.builder()
                .user(user)
                .role(role)
                .assignmentStatus(UserRole.AssignmentStatus.ACTIVE)
                .assignmentNote(request.note())
                .build();
        userRoleRepository.save(ur);
        if (!user.isOnboardingCompleted()) {
            user.setOnboardingCompleted(true);
            userRepository.save(user);
        }

        auditLogService.log("ASSIGN_ROLE", "UserRole", user.getUsername() + " -> " + cleanRole);
        return mapToResponse(user);
    }

    private UserDTO.UserResponse mapToResponse(User user) {
        List<UserRole> activeRoles = userRoleRepository.findActiveRolesByUserId(user.getId());
        List<String> roles = activeRoles.stream()
                .map(ur -> ur.getRole().getRoleName().name())
                .collect(Collectors.toList());

        return new UserDTO.UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getAccountStatus(),
                user.getCreatedAt(),
                roles
        );
    }
}
