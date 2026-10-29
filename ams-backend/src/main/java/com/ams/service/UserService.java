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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
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
        }

        user = userRepository.save(user);
        auditLogService.log("UPDATE_USER", "User", user.getUsername());
        return mapToResponse(user);
    }

    @Transactional
    public UserDTO.UserResponse assignRole(Long userId, UserDTO.AssignRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String cleanRole = request.roleName().replace("ROLE_", "");
        Role.RoleName rName = Role.RoleName.valueOf(cleanRole);
        Role role = roleRepository.findByRoleName(rName)
                .orElseThrow(() -> new BadRequestException("Role not found: " + cleanRole));

        UserRole ur = UserRole.builder()
                .user(user)
                .role(role)
                .assignmentStatus(UserRole.AssignmentStatus.ACTIVE)
                .assignmentNote(request.note())
                .build();
        userRoleRepository.save(ur);

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
