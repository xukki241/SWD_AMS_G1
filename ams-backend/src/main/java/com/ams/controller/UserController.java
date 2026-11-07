package com.ams.controller;

import com.ams.dto.UserDTO;
import com.ams.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Admin User & Role Management APIs")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO.ProfileResponse> me() { return ResponseEntity.ok(userService.getMyProfile()); }

    @PatchMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO.ProfileResponse> updateMe(@Valid @RequestBody UserDTO.UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateMyProfile(request));
    }

    @PostMapping(value = "/me/avatar", consumes = "multipart/form-data")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO.ProfileResponse> avatar(@RequestParam("file") MultipartFile file) throws java.io.IOException {
        return ResponseEntity.ok(userService.uploadMyAvatar(file));
    }

    @PostMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody UserDTO.ChangePasswordRequest request) {
        userService.changeMyPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO.UserResponse> unlock(@PathVariable Long id) {
        return ResponseEntity.ok(userService.unlockUser(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Get all users")
    public ResponseEntity<List<UserDTO.UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserDTO.UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new user")
    public ResponseEntity<UserDTO.UserResponse> createUser(@Valid @RequestBody UserDTO.CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user details")
    public ResponseEntity<UserDTO.UserResponse> updateUser(@PathVariable Long id, @RequestBody UserDTO.UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign a role to user")
    public ResponseEntity<UserDTO.UserResponse> assignRole(@PathVariable Long id, @Valid @RequestBody UserDTO.AssignRoleRequest request) {
        return ResponseEntity.ok(userService.assignRole(id, request));
    }
}
