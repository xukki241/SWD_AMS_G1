package com.ams.dto;

import com.ams.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

public class UserDTO {

    public record UserResponse(
            Long id,
            String username,
            String email,
            String fullName,
            User.AccountStatus accountStatus,
            LocalDateTime createdAt,
            List<String> roles
    ) {}

    public record CreateUserRequest(
            @NotBlank String username,
            @NotBlank @Email String email,
            @NotBlank String password,
            @NotBlank String fullName,
            List<String> roles
    ) {}

    public record UpdateUserRequest(
            String fullName,
            User.AccountStatus accountStatus
    ) {}

    public record AssignRoleRequest(
            @NotBlank String roleName,
            String note
    ) {}
}
