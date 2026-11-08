package com.ams.service;

import com.ams.dto.EnrollmentDTO;
import com.ams.entity.Course;
import com.ams.entity.CourseEnrollment;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.CourseEnrollmentRepository;
import com.ams.repository.CourseRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseEnrollmentService {

    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<EnrollmentDTO.EnrollmentResponse> getMyEnrollments() {
        User student = currentUser();
        return enrollmentRepository.findByStudentId(student.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDTO.EnrollmentResponse> getCourseRoster(Long courseId) {
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EnrollmentDTO.EnrollmentResponse getMyEnrollmentInCourse(Long courseId) {
        User student = currentUser();
        CourseEnrollment enrollment = enrollmentRepository.findByCourseIdAndStudentId(courseId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "You are not enrolled in course " + courseId));
        return mapToResponse(enrollment);
    }

    /**
     * Enroll the current student in a course. Free courses activate immediately;
     * paid courses stay PENDING_PAYMENT until a payment succeeds.
     */
    @Transactional
    public EnrollmentDTO.EnrollmentResponse enroll(Long courseId) {
        User student = currentUser();

        Course course = courseRepository.findById(courseId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
        if (course.getStatus() != Course.Status.PUBLISHED) {
            throw new BadRequestException("Only published courses can be enrolled");
        }

        enrollmentRepository.findByCourseIdAndStudentId(courseId, student.getId())
                .ifPresent(existing -> {
                    if (existing.getStatus() == CourseEnrollment.EnrollmentStatus.CANCELLED) {
                        existing.setStatus(CourseEnrollment.EnrollmentStatus.PENDING_PAYMENT);
                        enrollmentRepository.save(existing);
                    } else {
                        throw new BadRequestException("You are already enrolled in this course");
                    }
                });

        CourseEnrollment enrollment = enrollmentRepository
                .findByCourseIdAndStudentId(courseId, student.getId())
                .orElseGet(() -> CourseEnrollment.builder()
                        .course(course)
                        .student(student)
                        .registrationReference(generateReference())
                        .amount(course.isFree() || course.getPrice().compareTo(BigDecimal.ZERO) == 0
                                ? BigDecimal.ZERO : course.getPrice())
                        .build());

        if (enrollment.getAmount().compareTo(BigDecimal.ZERO) == 0) {
            enrollment.setStatus(CourseEnrollment.EnrollmentStatus.ACTIVE);
            enrollment.setActivatedAt(LocalDateTime.now());
        } else if (enrollment.getStatus() == CourseEnrollment.EnrollmentStatus.ACTIVE) {
            // re-enroll of a paid course shouldn't happen, but stay safe
            enrollment.setStatus(CourseEnrollment.EnrollmentStatus.PENDING_PAYMENT);
            enrollment.setActivatedAt(null);
        } else if (enrollment.getStatus() == CourseEnrollment.EnrollmentStatus.CANCELLED) {
            enrollment.setStatus(CourseEnrollment.EnrollmentStatus.PENDING_PAYMENT);
        }

        enrollment = enrollmentRepository.save(enrollment);
        auditLogService.log("COURSE_ENROLLED", "ENROLLMENT", enrollment.getRegistrationReference());
        return mapToResponse(enrollment);
    }

    @Transactional
    public void cancelEnrollment(Long enrollmentId) {
        User student = currentUser();
        CourseEnrollment enrollment = enrollmentRepository.findByIdAndStudentId(enrollmentId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found: " + enrollmentId));

        if (enrollment.getStatus() == CourseEnrollment.EnrollmentStatus.COMPLETED) {
            throw new BadRequestException("Completed enrollments cannot be cancelled");
        }

        enrollment.setStatus(CourseEnrollment.EnrollmentStatus.CANCELLED);
        enrollmentRepository.save(enrollment);
        auditLogService.log("ENROLLMENT_CANCELLED", "ENROLLMENT", enrollment.getRegistrationReference());
    }

    /** Idempotent activation after a successful payment. */
    @Transactional
    public void activateEnrollment(Long enrollmentId) {
        enrollmentRepository.findById(enrollmentId).ifPresent(enrollment -> {
            if (enrollment.getStatus() == CourseEnrollment.EnrollmentStatus.PENDING_PAYMENT) {
                enrollment.setStatus(CourseEnrollment.EnrollmentStatus.ACTIVE);
                enrollment.setActivatedAt(LocalDateTime.now());
                enrollmentRepository.save(enrollment);
                auditLogService.log("ENROLLMENT_ACTIVATED", "ENROLLMENT", enrollment.getRegistrationReference());
            }
        });
    }

    private String generateReference() {
        return "ENR-F26-" + String.format("%04d", enrollmentRepository.count() + 1001)
                + "-" + Long.toString(System.currentTimeMillis() % 10000);
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private EnrollmentDTO.EnrollmentResponse mapToResponse(CourseEnrollment e) {
        Course course = e.getCourse();
        return new EnrollmentDTO.EnrollmentResponse(
                e.getId(),
                course.getId(),
                course.getTitle(),
                course.getCode(),
                course.getThumbnailUrl(),
                e.getStudent().getId(),
                e.getStudent().getFullName(),
                e.getRegistrationReference(),
                e.getStatus(),
                e.getAmount(),
                e.getRegisteredAt(),
                e.getActivatedAt()
        );
    }
}
