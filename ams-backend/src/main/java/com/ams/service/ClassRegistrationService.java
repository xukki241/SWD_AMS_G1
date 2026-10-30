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
        User student = currentUser();
        SubjectClass subjectClass = subjectClassRepository.findById(request.subjectClassId())
                .orElseThrow(() -> new ResourceNotFoundException("SubjectClass not found with id: " + request.subjectClassId()));
        return createRegistration(student, subjectClass);
    }

    @Transactional
    public RegistrationDTO.RegistrationResponse joinByCode(RegistrationDTO.JoinRequest request) {
        User student = currentUser();
        SubjectClass subjectClass = subjectClassRepository.findByJoinCode(request.code())
                .orElseThrow(() -> new ResourceNotFoundException("No class found with join code: " + request.code()));
        return createRegistration(student, subjectClass);
    }

    private RegistrationDTO.RegistrationResponse createRegistration(User student, SubjectClass subjectClass) {
        if (registrationRepository.existsByStudentIdAndSubjectClassId(student.getId(), subjectClass.getId())) {
            throw new DuplicateResourceException("You have already registered for class: " + subjectClass.getClassCode());
        }

        long enrolled = registrationRepository.countBySubjectClassIdAndStatus(
                subjectClass.getId(), ClassRegistration.RegistrationStatus.ACTIVE);
        Integer capacity = subjectClass.getCapacity();
        if (capacity != null && capacity > 0 && enrolled >= capacity) {
            throw new DuplicateResourceException("Class " + subjectClass.getClassCode() + " is full (capacity: " + capacity + ")");
        }

        // A-03: payment is only required when the class charges a registration fee.
        boolean free = subjectClass.getRegistrationFee() == null
                || subjectClass.getRegistrationFee().signum() == 0;
        ClassRegistration.RegistrationStatus initialStatus = free
                ? ClassRegistration.RegistrationStatus.ACTIVE
                : ClassRegistration.RegistrationStatus.PENDING_PAYMENT;

        String ref = "REG-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        ClassRegistration reg = ClassRegistration.builder()
                .student(student)
                .subjectClass(subjectClass)
                .registrationReference(ref)
                .status(initialStatus)
                .registeredAt(LocalDateTime.now())
                .activatedAt(initialStatus == ClassRegistration.RegistrationStatus.ACTIVE ? LocalDateTime.now() : null)
                .build();

        reg = registrationRepository.save(reg);
        auditLogService.log(free ? "REGISTER_CLASS_FREE" : "REGISTER_CLASS", "ClassRegistration", ref);
        return mapToResponse(reg);
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));
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
