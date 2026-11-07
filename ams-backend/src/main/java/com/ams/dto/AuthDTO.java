package com.ams.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AuthDTO {

    public record LoginRequest(
            @NotBlank(message = "Email or username is required")
            String identifier,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    public record RegisterResponse(String message, String email) {}
    public record ForgotPasswordRequest(@NotBlank @Email String email) {}
    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 10, message = "Password must be at least 10 characters") String password
    ) {}
    public record GoogleLoginRequest(@NotBlank String idToken) {}

    public record RegisterRequest(
            @NotBlank(message = "Username is required")
            @Size(min = 3, max = 50)
            String username,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 6, message = "Password must be at least 6 characters")
            String password,

            @NotBlank(message = "Full name is required")
            String fullName
    ) {}

    public record AuthResponse(
            String token,
            String tokenType,
            Long userId,
            String username,
            String email,
            String fullName,
            String avatarUrl,
            List<String> roles
    ) {}
}
