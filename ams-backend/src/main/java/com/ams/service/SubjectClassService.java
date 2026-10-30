package com.ams.service;

import com.ams.dto.SubjectClassDTO;
import com.ams.entity.AssignmentClass;
import com.ams.entity.ClassRegistration;
import com.ams.entity.Subject;
import com.ams.entity.SubjectClass;
import com.ams.entity.Submission;
import com.ams.entity.User;
import com.ams.exception.DuplicateResourceException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.AssignmentClassRepository;
import com.ams.repository.ClassRegistrationRepository;
import com.ams.repository.SubjectClassRepository;
import com.ams.repository.SubjectRepository;
import com.ams.repository.SubmissionRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectClassService {

    private static final String JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SubjectClassRepository subjectClassRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final ClassRegistrationRepository registrationRepository;
    private final AssignmentClassRepository assignmentClassRepository;
    private final SubmissionRepository submissionRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<SubjectClassDTO.SubjectClassResponse> getAllClasses() {
        return subjectClassRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubjectClassDTO.SubjectClassResponse getClassById(Long id) {
        SubjectClass sc = subjectClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));
        return mapToResponse(sc);
    }

    @Transactional(readOnly = true)
    public List<SubjectClassDTO.SubjectClassResponse> getClassesByTeacher(Long teacherId) {
        return subjectClassRepository.findByTeacherId(teacherId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /** Public catalog for the guest landing page — no auth required. */
    @Transactional(readOnly = true)
    public List<SubjectClassDTO.SubjectClassResponse> getPublicCatalog() {
        return getAllClasses();
    }

    /** Classes the current user belongs to: staff via teacher/expert FK, students via ACTIVE/PENDING registrations. */
    @Transactional(readOnly = true)
    public List<SubjectClassDTO.MyClassResponse> getMyClasses() {
        User user = currentUser();
        Map<Long, SubjectClass> classes = new LinkedHashMap<>();

        List<SubjectClass> taught = subjectClassRepository.findByTeacherId(user.getId());
        taught.forEach(sc -> classes.put(sc.getId(), sc));
        subjectClassRepository.findByExpertId(user.getId()).forEach(sc -> classes.put(sc.getId(), sc));

        List<ClassRegistration> myRegs = registrationRepository.findByStudentId(user.getId());
        for (ClassRegistration reg : myRegs) {
            if (reg.getStatus() == ClassRegistration.RegistrationStatus.ACTIVE
                    || reg.getStatus() == ClassRegistration.RegistrationStatus.PENDING_PAYMENT) {
                classes.computeIfAbsent(reg.getSubjectClass().getId(), id -> reg.getSubjectClass());
            }
        }

        return classes.values().stream()
                .map(sc -> mapToMyClassResponse(sc, user, myRegs))
                .collect(Collectors.toList());
    }

    @Transactional
    public SubjectClassDTO.SubjectClassResponse createClass(SubjectClassDTO.CreateSubjectClassRequest request) {
        if (subjectClassRepository.findByClassCode(request.classCode()).isPresent()) {
            throw new DuplicateResourceException("Class code '" + request.classCode() + "' already exists");
        }

        Subject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.subjectId()));

        User expert = request.expertId() != null
                ? userRepository.findById(request.expertId()).orElse(null)
                : null;

        User teacher = request.teacherId() != null
                ? userRepository.findById(request.teacherId()).orElse(null)
                : null;

        String joinCode = request.joinCode();
        if (joinCode == null || joinCode.isBlank()) {
            joinCode = generateJoinCode();
        } else if (subjectClassRepository.findByJoinCode(joinCode).isPresent()) {
            throw new DuplicateResourceException("Join code '" + joinCode + "' is already in use");
        }

        SubjectClass sc = SubjectClass.builder()
                .subject(subject)
                .expert(expert)
                .teacher(teacher)
                .classCode(request.classCode())
                .className(request.className())
                .term(request.term())
                .joinCode(joinCode)
                .capacity(request.capacity())
                .registrationFee(request.registrationFee())
                .build();

        sc = subjectClassRepository.save(sc);
        auditLogService.log("CREATE_CLASS", "SubjectClass", sc.getClassCode() + " joinCode=" + sc.getJoinCode());
        return mapToResponse(sc);
    }

    private String generateJoinCode() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(JOIN_CODE_ALPHABET.charAt(RANDOM.nextInt(JOIN_CODE_ALPHABET.length())));
        }
        String code = sb.toString();
        while (subjectClassRepository.findByJoinCode(code).isPresent()) {
            code = generateJoinCode();
        }
        return code;
    }

    private SubjectClassDTO.MyClassResponse mapToMyClassResponse(SubjectClass sc, User user, List<ClassRegistration> myRegs) {
        long enrolled = registrationRepository.countBySubjectClassIdAndStatus(
                sc.getId(), ClassRegistration.RegistrationStatus.ACTIVE);
        List<AssignmentClass> allocations = assignmentClassRepository.findBySubjectClassId(sc.getId()).stream()
                .filter(ac -> ac.getAllocationStatus() == AssignmentClass.AllocationStatus.ACTIVE)
                .toList();
        long assignmentCount = allocations.size();

        // Ungraded work: SUBMITTED/LATE submissions for this class's assignments that are not yet GRADED.
        long ungradedCount = allocations.stream()
                .flatMap(ac -> submissionRepository.findByAssignmentId(ac.getAssignment().getId()).stream())
                .filter(s -> s.getClassRegistration().getSubjectClass().getId().equals(sc.getId()))
                .filter(s -> s.getSubmissionStatus() == Submission.SubmissionStatus.SUBMITTED
                        || s.getSubmissionStatus() == Submission.SubmissionStatus.LATE)
                .count();

        ClassRegistration myReg = myRegs.stream()
                .filter(r -> r.getSubjectClass().getId().equals(sc.getId()))
                .findFirst()
                .orElse(null);

        BigDecimal registrationFee = sc.getRegistrationFee();

        return new SubjectClassDTO.MyClassResponse(
                sc.getId(),
                sc.getClassCode(),
                sc.getClassName(),
                sc.getJoinCode(),
                sc.getTerm(),
                sc.getSubject().getSubjectCode(),
                sc.getSubject().getSubjectName(),
                sc.getTeacher() != null ? sc.getTeacher().getId() : null,
                sc.getTeacher() != null ? sc.getTeacher().getFullName() : null,
                sc.getExpert() != null ? sc.getExpert().getId() : null,
                sc.getExpert() != null ? sc.getExpert().getFullName() : null,
                registrationFee,
                sc.getCapacity(),
                (int) enrolled,
                (int) assignmentCount,
                (int) ungradedCount,
                myReg != null ? myReg.getStatus() : null
        );
    }

    private SubjectClassDTO.SubjectClassResponse mapToResponse(SubjectClass sc) {
        long enrolled = registrationRepository.countBySubjectClassIdAndStatus(
                sc.getId(), ClassRegistration.RegistrationStatus.ACTIVE);
        return new SubjectClassDTO.SubjectClassResponse(
                sc.getId(),
                sc.getSubject().getId(),
                sc.getSubject().getSubjectCode(),
                sc.getSubject().getSubjectName(),
                sc.getExpert() != null ? sc.getExpert().getId() : null,
                sc.getExpert() != null ? sc.getExpert().getFullName() : null,
                sc.getTeacher() != null ? sc.getTeacher().getId() : null,
                sc.getTeacher() != null ? sc.getTeacher().getFullName() : null,
                sc.getClassCode(),
                sc.getClassName(),
                sc.getTerm(),
                sc.getJoinCode(),
                sc.getCapacity(),
                sc.getRegistrationFee(),
                (int) enrolled
        );
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}
