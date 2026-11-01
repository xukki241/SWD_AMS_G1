package com.ams.service;

import com.ams.dto.SubjectClassDTO;
import com.ams.entity.AssignmentClass;
import com.ams.entity.ClassRegistration;
import com.ams.entity.Subject;
import com.ams.entity.SubjectClass;
import com.ams.entity.Submission;
import com.ams.entity.SystemConfiguration;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.AssignmentClassRepository;
import com.ams.repository.ClassRegistrationRepository;
import com.ams.repository.SubjectClassRepository;
import com.ams.repository.SubjectRepository;
import com.ams.repository.SubmissionRepository;
import com.ams.repository.SystemConfigurationRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectClassService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final String FEE_CONFIG_KEY = "registration.fee.default";
    private static final BigDecimal DEFAULT_FEE = new BigDecimal("50000");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final SubjectClassRepository subjectClassRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final ClassRegistrationRepository registrationRepository;
    private final AssignmentClassRepository assignmentClassRepository;
    private final SubmissionRepository submissionRepository;
    private final SystemConfigurationRepository systemConfigurationRepository;
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

    /** Public catalog for the guest landing page — no auth required. ACTIVE classes only. */
    @Transactional(readOnly = true)
    public List<SubjectClassDTO.SubjectClassResponse> getPublicCatalog() {
        return subjectClassRepository.findByStatus(SubjectClass.ClassStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /** Classes the current user belongs to: staff via teacher/expert FK, students via ACTIVE/PENDING registrations. ACTIVE classes only. */
    @Transactional(readOnly = true)
    public List<SubjectClassDTO.MyClassResponse> getMyClasses() {
        User user = currentUser();
        Map<Long, SubjectClass> classes = new LinkedHashMap<>();

        subjectClassRepository.findByTeacherIdAndStatus(user.getId(), SubjectClass.ClassStatus.ACTIVE)
                .forEach(sc -> classes.put(sc.getId(), sc));
        subjectClassRepository.findByExpertIdAndStatus(user.getId(), SubjectClass.ClassStatus.ACTIVE)
                .forEach(sc -> classes.put(sc.getId(), sc));

        List<ClassRegistration> myRegs = registrationRepository.findByStudentId(user.getId());
        for (ClassRegistration reg : myRegs) {
            if (reg.getStatus() == ClassRegistration.RegistrationStatus.ACTIVE
                    || reg.getStatus() == ClassRegistration.RegistrationStatus.PENDING_PAYMENT) {
                SubjectClass sc = reg.getSubjectClass();
                if (sc.getStatus() == SubjectClass.ClassStatus.ACTIVE) {
                    classes.computeIfAbsent(sc.getId(), id -> sc);
                }
            }
        }

        return classes.values().stream()
                .map(sc -> mapToMyClassResponse(sc, user, myRegs))
                .collect(Collectors.toList());
    }

    @Transactional
    public SubjectClassDTO.SubjectClassResponse createClass(SubjectClassDTO.CreateSubjectClassRequest request) {
        User teacher = currentUser();

        Subject subject = upsertSubjectFromName(request.subjectName());
        String classCode = generateClassCode(request.className());
        String joinCode = generateJoinCode();
        String term = truncate(blankToEmpty(request.section()), 20);
        String room = blankToNull(request.room());
        BigDecimal fee = resolveDefaultRegistrationFee();

        SubjectClass sc = SubjectClass.builder()
                .subject(subject)
                .expert(null)
                .teacher(teacher)
                .classCode(classCode)
                .className(request.className().trim())
                .term(term)
                .room(room)
                .joinCode(joinCode)
                .capacity(0)
                .registrationFee(fee)
                .status(SubjectClass.ClassStatus.ACTIVE)
                .build();

        sc = subjectClassRepository.save(sc);
        auditLogService.log("CREATE_CLASS", "SubjectClass", sc.getClassCode() + " joinCode=" + sc.getJoinCode());
        return mapToResponse(sc);
    }

    @Transactional
    public SubjectClassDTO.SubjectClassResponse updateClass(Long id, SubjectClassDTO.UpdateSubjectClassRequest request) {
        SubjectClass sc = subjectClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));
        requireOwningTeacher(sc);

        if (request.className() != null && !request.className().isBlank()) {
            sc.setClassName(request.className().trim());
        }
        String sectionOrTerm = request.section() != null ? request.section() : request.term();
        if (sectionOrTerm != null) {
            sc.setTerm(truncate(blankToEmpty(sectionOrTerm), 20));
        }
        if (request.room() != null) {
            sc.setRoom(blankToNull(request.room()));
        }

        sc = subjectClassRepository.save(sc);
        auditLogService.log("UPDATE_CLASS", "SubjectClass", sc.getClassCode());
        return mapToResponse(sc);
    }

    @Transactional
    public SubjectClassDTO.SubjectClassResponse archiveClass(Long id) {
        SubjectClass sc = subjectClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + id));
        requireOwningTeacher(sc);

        if (sc.getStatus() == SubjectClass.ClassStatus.ARCHIVED) {
            throw new BadRequestException("Class is already archived");
        }

        sc.setStatus(SubjectClass.ClassStatus.ARCHIVED);
        sc = subjectClassRepository.save(sc);
        auditLogService.log("ARCHIVE_CLASS", "SubjectClass", sc.getClassCode());
        return mapToResponse(sc);
    }

    /** Owning teacher soft-removes a student by setting their registration to CANCELLED. */
    @Transactional
    public void removeStudent(Long classId, Long studentId) {
        SubjectClass sc = subjectClassRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + classId));
        requireOwningTeacher(sc);

        ClassRegistration reg = registrationRepository.findByStudentIdAndSubjectClassId(studentId, classId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Registration not found for student " + studentId + " in class " + classId));

        if (reg.getStatus() == ClassRegistration.RegistrationStatus.CANCELLED) {
            throw new BadRequestException("Student is already removed from this class");
        }

        reg.setStatus(ClassRegistration.RegistrationStatus.CANCELLED);
        registrationRepository.save(reg);
        auditLogService.log("REMOVE_STUDENT", "ClassRegistration",
                reg.getRegistrationReference() + " class=" + sc.getClassCode());
    }

    private void requireOwningTeacher(SubjectClass sc) {
        User user = currentUser();
        if (sc.getTeacher() == null || !user.getId().equals(sc.getTeacher().getId())) {
            throw new AccessDeniedException("Only the class teacher can modify this class");
        }
    }

    private Subject upsertSubjectFromName(String rawName) {
        String name = rawName.trim();
        return subjectRepository.findFirstBySubjectNameIgnoreCase(name)
                .orElseGet(() -> {
                    Subject created = Subject.builder()
                            .subjectCode(generateSubjectCode(name))
                            .subjectName(name)
                            .description(null)
                            .status(Subject.SubjectStatus.ACTIVE)
                            .build();
                    created = subjectRepository.save(created);
                    auditLogService.log("CREATE_SUBJECT", "Subject", created.getSubjectCode());
                    return created;
                });
    }

    private BigDecimal resolveDefaultRegistrationFee() {
        return systemConfigurationRepository.findByConfigurationName(FEE_CONFIG_KEY)
                .map(SystemConfiguration::getBusinessValue)
                .filter(v -> v != null && !v.isBlank())
                .map(v -> {
                    try {
                        return new BigDecimal(v.trim());
                    } catch (NumberFormatException ex) {
                        return DEFAULT_FEE;
                    }
                })
                .orElse(DEFAULT_FEE);
    }

    private String generateSubjectCode(String subjectName) {
        String slug = slugify(subjectName);
        if (slug.isEmpty()) {
            slug = "SUBJ";
        }
        if (slug.length() > 12) {
            slug = slug.substring(0, 12);
        }
        String candidate = slug;
        int attempt = 0;
        while (subjectRepository.findBySubjectCode(candidate).isPresent()) {
            attempt++;
            String suffix = shortSuffix(attempt);
            int maxBase = Math.max(1, 20 - suffix.length());
            candidate = slug.substring(0, Math.min(slug.length(), maxBase)) + suffix;
        }
        return candidate;
    }

    private String generateClassCode(String className) {
        String slug = slugify(className);
        if (slug.isEmpty()) {
            slug = "CLASS";
        }
        if (slug.length() > 10) {
            slug = slug.substring(0, 10);
        }
        String candidate = slug + "-" + randomToken(4);
        while (subjectClassRepository.findByClassCode(candidate).isPresent()) {
            candidate = slug.substring(0, Math.min(slug.length(), 10)) + "-" + randomToken(4);
        }
        if (candidate.length() > 20) {
            candidate = candidate.substring(0, 20);
            while (subjectClassRepository.findByClassCode(candidate).isPresent()) {
                candidate = slug.substring(0, Math.min(slug.length(), 12)) + randomToken(4);
            }
        }
        return candidate;
    }

    private String generateJoinCode() {
        String code = randomToken(6);
        while (subjectClassRepository.findByJoinCode(code).isPresent()) {
            code = randomToken(6);
        }
        return code;
    }

    private String randomToken(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
        }
        return sb.toString();
    }

    private String shortSuffix(int attempt) {
        if (attempt < 10) {
            return String.valueOf(attempt);
        }
        return randomToken(3);
    }

    private static String slugify(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        String cleaned = normalized.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "");
        return cleaned;
    }

    private static String blankToEmpty(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max);
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
                sc.getRoom(),
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
                myReg != null ? myReg.getStatus() : null,
                sc.getStatus()
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
                sc.getRoom(),
                sc.getJoinCode(),
                sc.getCapacity(),
                sc.getRegistrationFee(),
                (int) enrolled,
                sc.getStatus()
        );
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}
