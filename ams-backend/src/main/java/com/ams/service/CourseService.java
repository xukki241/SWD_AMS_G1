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
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CourseService {

    private static final long MAX_THUMBNAIL_BYTES = 5L * 1024 * 1024;
    private static final String THUMBNAIL_FOLDER = "course-thumbnails";

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final FileUploadService fileUploadService;
    private final AuditLogService auditLogService;
    private final RoleChecker roleChecker;

    @Transactional(readOnly = true)
    public Page<CourseDTO.CourseSummaryResponse> listCourses(
            String keyword, Long categoryId, Course.Status status, int page, int size) {

        User user = currentUser();
        boolean admin = isAdmin(user);
        String normalizedKeyword = normalizeKeyword(keyword);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Course> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("deleted")));
            if (normalizedKeyword != null) {
                String like = "%" + normalizedKeyword + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("code")), like)
                ));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (!admin) {
                predicates.add(cb.equal(root.get("instructor").get("id"), user.getId()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return courseRepository.findAll(specification, pageable).map(this::mapSummary);
    }

    /** Public catalog: only published, non-deleted courses. No auth context required. */
    @Transactional(readOnly = true)
    public Page<CourseDTO.CourseSummaryResponse> listPublishedCourses(
            String keyword, Long categoryId, int page, int size) {

        String normalizedKeyword = normalizeKeyword(keyword);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Course> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("deleted")));
            predicates.add(cb.equal(root.get("status"), Course.Status.PUBLISHED));
            if (normalizedKeyword != null) {
                String like = "%" + normalizedKeyword + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("code")), like)
                ));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return courseRepository.findAll(specification, pageable).map(this::mapSummary);
    }

    /** Public detail: only published, non-deleted courses are visible. */
    @Transactional(readOnly = true)
    public CourseDTO.CourseDetailResponse getPublishedCourse(Long id) {
        Course course = courseRepository.findByIdAndDeletedFalse(id)
                .filter(found -> found.getStatus() == Course.Status.PUBLISHED)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        return mapDetail(course);
    }

    @Transactional(readOnly = true)
    public CourseDTO.CourseDetailResponse getCourse(Long id) {
        return mapDetail(getAccessibleCourse(id));
    }

    /** Used by content/AI services to enforce teacher ownership (or admin). */
    @Transactional(readOnly = true)
    public Course getAccessibleCourse(Long id) {
        Course course = courseRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        User user = currentUser();
        if (!isAdmin(user) && !course.getInstructor().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the course owner or an administrator can access this course");
        }
        return course;
    }

    @Transactional
    public CourseDTO.CourseDetailResponse createCourse(CourseDTO.CourseRequest request, MultipartFile thumbnail) {
        User user = currentUser();
        // Exclusive roles: students (even with a stale TEACHER grant) cannot create courses.
        if (roleChecker.hasRole(user.getId(), Role.RoleName.STUDENT)
                && !roleChecker.hasRole(user.getId(), Role.RoleName.ADMIN)) {
            throw new AccessDeniedException("Students cannot create courses");
        }
        if (!roleChecker.hasRole(user.getId(), Role.RoleName.TEACHER, Role.RoleName.ADMIN)) {
            throw new AccessDeniedException("Only teachers or administrators can create courses");
        }
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));

        String code = normalizeCode(request.code());
        if (courseRepository.existsByCodeIgnoreCaseAndDeletedFalse(code)) {
            throw new DuplicateResourceException("Course code already exists");
        }

        String thumbnailUrl = request.thumbnailUrl();
        if (hasUpload(thumbnail)) {
            thumbnailUrl = uploadThumbnail(thumbnail);
        }

        boolean free = Boolean.TRUE.equals(request.isFree());
        BigDecimal price = free ? BigDecimal.ZERO : request.price();

        Course course = Course.builder()
                .title(request.title().trim())
                .code(code)
                .category(category)
                .description(request.description().trim())
                .thumbnailUrl(thumbnailUrl)
                .price(price)
                .isFree(free)
                .status(request.status() == null ? Course.Status.DRAFT : request.status())
                .difficultyLevel(request.difficultyLevel() == null
                        ? Course.DifficultyLevel.BEGINNER : request.difficultyLevel())
                .about(trimToNull(request.about()))
                .whatStudentsWillLearn(trimToNull(request.whatStudentsWillLearn()))
                .prerequisites(trimToNull(request.prerequisites()))
                .instructor(user)
                .build();

        course = courseRepository.save(course);
        auditLogService.log("COURSE_CREATED", "Course", course.getCode());
        return mapDetail(course);
    }

    @Transactional
    public CourseDTO.CourseDetailResponse updateCourse(
            Long id, CourseDTO.CourseRequest request, MultipartFile thumbnail) {

        Course course = getAccessibleCourse(id);
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));

        String code = normalizeCode(request.code());
        if (courseRepository.existsByCodeIgnoreCaseAndIdNotAndDeletedFalse(code, id)) {
            throw new DuplicateResourceException("Course code already exists");
        }

        boolean free = Boolean.TRUE.equals(request.isFree());
        BigDecimal price = free ? BigDecimal.ZERO : request.price();

        course.setTitle(request.title().trim());
        course.setCode(code);
        course.setCategory(category);
        course.setDescription(request.description().trim());
        course.setPrice(price);
        course.setFree(free);
        course.setStatus(request.status() == null ? course.getStatus() : request.status());
        course.setDifficultyLevel(request.difficultyLevel() == null
                ? course.getDifficultyLevel() : request.difficultyLevel());
        course.setAbout(trimToNull(request.about()));
        course.setWhatStudentsWillLearn(trimToNull(request.whatStudentsWillLearn()));
        course.setPrerequisites(trimToNull(request.prerequisites()));

        if (hasUpload(thumbnail)) {
            course.setThumbnailUrl(uploadThumbnail(thumbnail));
        } else if (request.thumbnailUrl() != null && !request.thumbnailUrl().isBlank()) {
            course.setThumbnailUrl(request.thumbnailUrl().trim());
        }

        course = courseRepository.save(course);
        auditLogService.log("COURSE_UPDATED", "Course", course.getCode());
        return mapDetail(course);
    }

    @Transactional
    public void deleteCourse(Long id) {
        Course course = getAccessibleCourse(id);
        if (courseRepository.hasEnrollments(id)) {
            throw new BadRequestException("Cannot delete this course because it already has enrollments");
        }
        course.setDeleted(true);
        courseRepository.save(course);
        auditLogService.log("COURSE_DELETED", "Course", course.getCode());
    }

    private CourseDTO.CourseSummaryResponse mapSummary(Course course) {
        return new CourseDTO.CourseSummaryResponse(
                course.getId(),
                course.getTitle(),
                course.getCode(),
                course.getCategory().getId(),
                course.getCategory().getName(),
                course.getThumbnailUrl(),
                course.getPrice(),
                course.isFree(),
                course.getStatus(),
                course.getDifficultyLevel(),
                course.getInstructor().getId(),
                course.getInstructor().getFullName(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }

    private CourseDTO.CourseDetailResponse mapDetail(Course course) {
        int moduleCount = (int) moduleRepository.countByCourseId(course.getId());
        int lessonCount = (int) lessonRepository.countByCourseId(course.getId());
        int totalDuration = (int) lessonRepository.sumDurationByCourseId(course.getId());

        List<CourseDTO.CurriculumModuleResponse> curriculum =
                moduleRepository.findByCourseIdOrderByOrderIndexAsc(course.getId()).stream()
                        .map(module -> new CourseDTO.CurriculumModuleResponse(
                                module.getId(),
                                module.getTitle(),
                                module.getOrderIndex(),
                                (int) lessonRepository.countByModuleId(module.getId())
                        ))
                        .toList();

        return new CourseDTO.CourseDetailResponse(
                course.getId(),
                course.getTitle(),
                course.getCode(),
                course.getCategory().getId(),
                course.getCategory().getName(),
                course.getDescription(),
                course.getThumbnailUrl(),
                course.getPrice(),
                course.isFree(),
                course.getStatus(),
                course.getDifficultyLevel(),
                course.getAbout(),
                course.getWhatStudentsWillLearn(),
                course.getPrerequisites(),
                course.getInstructor().getId(),
                course.getInstructor().getFullName(),
                course.getCreatedAt(),
                course.getUpdatedAt(),
                new CourseDTO.CourseMetricsResponse(moduleCount, lessonCount, totalDuration),
                curriculum
        );
    }

    private String uploadThumbnail(MultipartFile thumbnail) {
        validateThumbnail(thumbnail);
        try {
            Map<?, ?> result = fileUploadService.uploadFile(thumbnail, THUMBNAIL_FOLDER);
            Object url = result.get("secure_url");
            if (url == null || url.toString().isBlank()) {
                throw new BadRequestException("Could not upload thumbnail");
            }
            return url.toString();
        } catch (IOException ex) {
            throw new BadRequestException("Could not upload thumbnail");
        }
    }

    private void validateThumbnail(MultipartFile thumbnail) {
        if (thumbnail.getSize() > MAX_THUMBNAIL_BYTES) {
            throw new BadRequestException("Thumbnail must be 5MB or smaller");
        }
        String contentType = thumbnail.getContentType() == null
                ? "" : thumbnail.getContentType().toLowerCase(Locale.ROOT);
        if (!contentType.equals("image/png")
                && !contentType.equals("image/jpeg")
                && !contentType.equals("image/jpg")) {
            throw new BadRequestException("Thumbnail must be a PNG or JPG image");
        }
        try (InputStream input = thumbnail.getInputStream()) {
            byte[] header = input.readNBytes(8);
            boolean png = header.length >= 8
                    && (header[0] & 0xFF) == 0x89
                    && header[1] == 'P' && header[2] == 'N' && header[3] == 'G';
            boolean jpeg = header.length >= 3
                    && (header[0] & 0xFF) == 0xFF
                    && (header[1] & 0xFF) == 0xD8
                    && (header[2] & 0xFF) == 0xFF;
            if (!png && !jpeg) {
                throw new BadRequestException("Thumbnail must be a PNG or JPG image");
            }
        } catch (IOException ex) {
            throw new BadRequestException("Could not read the thumbnail");
        }
    }

    private boolean hasUpload(MultipartFile file) {
        return file != null && !file.isEmpty();
    }

    private boolean isAdmin(User user) {
        return roleChecker.hasRole(user.getId(), Role.RoleName.ADMIN);
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private static String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private static String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return keyword.trim().toLowerCase(Locale.ROOT);
    }

    private static String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
