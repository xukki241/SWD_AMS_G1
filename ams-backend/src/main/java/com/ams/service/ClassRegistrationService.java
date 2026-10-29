package com.ams.service;

import com.ams.dto.RegistrationDTO;
import com.ams.entity.ClassRegistration;
import com.ams.entity.SubjectClass;
import com.ams.entity.User;
import com.ams.exception.DuplicateResourceException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.ClassRegistrationRepository;
import com.ams.repository.SubjectClassRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassRegistrationService {

    private final ClassRegistrationRepository registrationRepository;
    private final SubjectClassRepository subjectClassRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<RegistrationDTO.RegistrationResponse> getMyRegistrations() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));

        return registrationRepository.findByStudentId(student.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RegistrationDTO.RegistrationResponse> getRegistrationsByClass(Long classId) {
        return registrationRepository.findBySubjectClassId(classId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RegistrationDTO.RegistrationResponse register(RegistrationDTO.CreateRegistrationRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));

        SubjectClass subjectClass = subjectClassRepository.findById(request.subjectClassId())
                .orElseThrow(() -> new ResourceNotFoundException("SubjectClass not found with id: " + request.subjectClassId()));

        if (registrationRepository.existsByStudentIdAndSubjectClassId(student.getId(), subjectClass.getId())) {
            throw new DuplicateResourceException("You have already registered for class: " + subjectClass.getClassCode());
        }

        String ref = "REG-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        ClassRegistration reg = ClassRegistration.builder()
                .student(student)
                .subjectClass(subjectClass)
                .registrationReference(ref)
                .status(ClassRegistration.RegistrationStatus.PENDING_PAYMENT)
                .registeredAt(LocalDateTime.now())
                .build();

        reg = registrationRepository.save(reg);
        auditLogService.log("REGISTER_CLASS", "ClassRegistration", ref);
        return mapToResponse(reg);
    }

    @Transactional
    public void activateRegistration(Long registrationId) {
        ClassRegistration reg = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id: " + registrationId));

        reg.setStatus(ClassRegistration.RegistrationStatus.ACTIVE);
        reg.setActivatedAt(LocalDateTime.now());
        registrationRepository.save(reg);

        auditLogService.log("ACTIVATE_REGISTRATION", "ClassRegistration", reg.getRegistrationReference());
    }

    private RegistrationDTO.RegistrationResponse mapToResponse(ClassRegistration r) {
        return new RegistrationDTO.RegistrationResponse(
                r.getId(),
                r.getStudent().getId(),
                r.getStudent().getFullName(),
                r.getSubjectClass().getId(),
                r.getSubjectClass().getClassCode(),
                r.getSubjectClass().getClassName(),
                r.getSubjectClass().getSubject().getSubjectCode(),
                r.getSubjectClass().getSubject().getSubjectName(),
                r.getRegistrationReference(),
                r.getStatus(),
                r.getRegisteredAt(),
                r.getActivatedAt()
        );
    }
}
