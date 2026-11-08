package com.ams.controller;

import com.ams.dto.AuthDTO;
import com.ams.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login and Registration APIs")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "User login with username and password")
    public ResponseEntity<AuthDTO.AuthResponse> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    @Operation(summary = "Register new student account")
    public ResponseEntity<AuthDTO.RegisterResponse> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<AuthDTO.RegisterResponse> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(new AuthDTO.RegisterResponse("Email verified. You can now sign in.", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthDTO.RegisterResponse> forgotPassword(@Valid @RequestBody AuthDTO.ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(new AuthDTO.RegisterResponse("If that email is registered, a reset link will be sent.", request.email()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody AuthDTO.ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.password());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/google")
    public ResponseEntity<AuthDTO.AuthResponse> google(@Valid @RequestBody AuthDTO.GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request.idToken()));
    }

    @PostMapping("/refresh")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Re-issue JWT with current roles from the database")
    public ResponseEntity<AuthDTO.AuthResponse> refresh() {
        return ResponseEntity.ok(authService.refreshSession());
    }
}
