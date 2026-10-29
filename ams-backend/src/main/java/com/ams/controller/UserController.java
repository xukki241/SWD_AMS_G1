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

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Admin User & Role Management APIs")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT', 'TEACHER')")
    @Operation(summary = "Get all users")
    public ResponseEntity<List<UserDTO.UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT', 'TEACHER')")
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
