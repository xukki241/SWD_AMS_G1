package com.ams.controller;

import com.ams.dto.RegistrationDTO;
import com.ams.service.ClassRegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
@Tag(name = "Class Registrations", description = "Student Course Registration APIs")
public class ClassRegistrationController {

    private final ClassRegistrationService registrationService;

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Get current student's registrations")
    public ResponseEntity<List<RegistrationDTO.RegistrationResponse>> getMyRegistrations() {
        return ResponseEntity.ok(registrationService.getMyRegistrations());
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @Operation(summary = "Get all registrations for a class")
    public ResponseEntity<List<RegistrationDTO.RegistrationResponse>> getRegistrationsByClass(@PathVariable Long classId) {
        return ResponseEntity.ok(registrationService.getRegistrationsByClass(classId));
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Register for a subject class")
    public ResponseEntity<RegistrationDTO.RegistrationResponse> register(@Valid @RequestBody RegistrationDTO.CreateRegistrationRequest request) {
        return ResponseEntity.ok(registrationService.register(request));
    }
}
