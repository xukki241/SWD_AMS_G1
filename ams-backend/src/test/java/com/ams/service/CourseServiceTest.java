package com.ams.service;

import com.ams.dto.CourseDTO;
import com.ams.entity.Category;
import com.ams.entity.Course;
import com.ams.entity.Role;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.exception.DuplicateResourceException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.CategoryRepository;
import com.ams.repository.CourseRepository;
import com.ams.repository.LessonRepository;
import com.ams.repository.ModuleRepository;
import com.ams.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private ModuleRepository moduleRepository;
    @Mock private LessonRepository lessonRepository;
    @Mock private FileUploadService fileUploadService;
    @Mock private AuditLogService auditLogService;
    @Mock private RoleChecker roleChecker;

    @InjectMocks private CourseService courseService;

    private User teacher;
    private Category category;

    @BeforeEach
    void setUp() {
        teacher = User.builder().id(2L).username("teacher1").fullName("Teacher One").build();
        category = Category.builder().id(1L).name("Programming").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "teacher1", null, List.of(new SimpleGrantedAuthority("ROLE_TEACHER"))));
        lenient().when(userRepository.findByUsername("teacher1")).thenReturn(Optional.of(teacher));
    }

    @Test
    void createCourseForcesZeroPriceForFreeCoursesAndNormalizesCode() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(courseRepository.existsByCodeIgnoreCaseAndDeletedFalse("SWD101")).thenReturn(false);
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> {
            Course course = invocation.getArgument(0);
            course.setId(10L);
            course.setCreatedAt(LocalDateTime.now());
            course.setUpdatedAt(LocalDateTime.now());
            return course;
        });
        stubEmptyMetrics(10L);

        CourseDTO.CourseDetailResponse response = courseService.createCourse(
                request("  swd101  ", new BigDecimal("99.00"), true), null);

        assertEquals("SWD101", response.code());
        assertEquals(0, response.price().compareTo(BigDecimal.ZERO));
        assertTrue(response.isFree());
        assertEquals(teacher.getId(), response.instructorId());
        verify(auditLogService).log(eq("COURSE_CREATED"), eq("Course"), eq("SWD101"));
    }

    @Test
    void createCourseRejectsDuplicateCodeCaseInsensitively() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(courseRepository.existsByCodeIgnoreCaseAndDeletedFalse("SWD101")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                () -> courseService.createCourse(request("swd101", BigDecimal.TEN, false), null));

        assertEquals("Course code already exists", ex.getMessage());
        verify(courseRepository, never()).save(any());
    }

    @Test
    void updateCourseRejectsNonOwner() {
        User otherTeacher = User.builder().id(99L).username("teacher2").fullName("Other").build();
        Course course = existingCourse(otherTeacher);
        when(courseRepository.findByIdAndDeletedFalse(10L)).thenReturn(Optional.of(course));

        assertThrows(AccessDeniedException.class,
                () -> courseService.updateCourse(10L, request("SWD101", BigDecimal.TEN, false), null));
        verify(courseRepository, never()).save(any());
    }

    @Test
    void deleteCourseSoftDeletesWhenThereAreNoEnrollments() {
        Course course = existingCourse(teacher);
        when(courseRepository.findByIdAndDeletedFalse(10L)).thenReturn(Optional.of(course));
        when(courseRepository.hasEnrollments(10L)).thenReturn(false);
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));

        courseService.deleteCourse(10L);

        assertTrue(course.isDeleted());
        verify(courseRepository).save(course);
        verify(auditLogService).log("COURSE_DELETED", "Course", "SWD101");
    }

    @Test
    void deleteCourseIsBlockedWhenEnrollmentsExist() {
        Course course = existingCourse(teacher);
        when(courseRepository.findByIdAndDeletedFalse(10L)).thenReturn(Optional.of(course));
        when(courseRepository.hasEnrollments(10L)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> courseService.deleteCourse(10L));
        assertFalse(course.isDeleted());
        verify(courseRepository, never()).save(any());
    }

    @Test
    void listCoursesReturnsMappedPageForTeacher() {
        Course course = existingCourse(teacher);
        Page<Course> page = new PageImpl<>(List.of(course));
        when(courseRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        Page<CourseDTO.CourseSummaryResponse> result =
                courseService.listCourses("swd", 1L, Course.Status.PUBLISHED, 0, 10);

        assertEquals(1, result.getTotalElements());
        assertEquals("SWD101", result.getContent().get(0).code());
        assertEquals("Programming", result.getContent().get(0).categoryName());
    }

    @Test
    void adminCanReadAnotherTeachersCourse() {
        User admin = User.builder().id(1L).username("admin").fullName("Admin").build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(roleChecker.hasRole(admin.getId(), Role.RoleName.ADMIN)).thenReturn(true);

        Course course = existingCourse(teacher);
        when(courseRepository.findByIdAndDeletedFalse(10L)).thenReturn(Optional.of(course));
        stubEmptyMetrics(10L);

        CourseDTO.CourseDetailResponse response = courseService.getCourse(10L);

        assertEquals(10L, response.id());
        assertEquals("Teacher One", response.instructorName());
    }

    @Test
    void getPublishedCourseReturnsPublishedCourse() {
        Course course = existingCourse(teacher);
        when(courseRepository.findByIdAndDeletedFalse(10L)).thenReturn(Optional.of(course));
        stubEmptyMetrics(10L);

        CourseDTO.CourseDetailResponse response = courseService.getPublishedCourse(10L);

        assertEquals(10L, response.id());
        assertEquals("SWD101", response.code());
    }

    @Test
    void getPublishedCourseHidesDraftCourses() {
        Course draft = existingCourse(teacher);
        draft.setStatus(Course.Status.DRAFT);
        when(courseRepository.findByIdAndDeletedFalse(10L)).thenReturn(Optional.of(draft));

        assertThrows(ResourceNotFoundException.class, () -> courseService.getPublishedCourse(10L));
        verifyNoInteractions(moduleRepository, lessonRepository);
    }

    @Test
    void listPublishedCoursesDoesNotRequireAuthentication() {
        SecurityContextHolder.clearContext();
        Course course = existingCourse(teacher);
        when(courseRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(course)));

        Page<CourseDTO.CourseSummaryResponse> result =
                courseService.listPublishedCourses(null, null, 0, 10);

        assertEquals(1, result.getTotalElements());
        assertEquals("SWD101", result.getContent().get(0).code());
    }

    private void stubEmptyMetrics(Long courseId) {
        when(moduleRepository.countByCourseId(courseId)).thenReturn(0L);
        when(lessonRepository.countByCourseId(courseId)).thenReturn(0L);
        when(lessonRepository.sumDurationByCourseId(courseId)).thenReturn(0L);
        when(moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId)).thenReturn(List.of());
    }

    private Course existingCourse(User instructor) {
        return Course.builder()
                .id(10L)
                .title("Spring Boot Fundamentals")
                .code("SWD101")
                .category(category)
                .description("Learn Spring Boot")
                .price(new BigDecimal("50.00"))
                .isFree(false)
                .status(Course.Status.PUBLISHED)
                .difficultyLevel(Course.DifficultyLevel.BEGINNER)
                .instructor(instructor)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private CourseDTO.CourseRequest request(String code, BigDecimal price, boolean free) {
        return new CourseDTO.CourseRequest(
                "  Spring Boot Fundamentals  ",
                code,
                1L,
                "  Learn Spring Boot  ",
                null,
                price,
                free,
                Course.Status.PUBLISHED,
                Course.DifficultyLevel.BEGINNER,
                "About",
                "Outcomes",
                "Prerequisites"
        );
    }
}
