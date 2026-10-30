package com.ams.service;

import com.ams.dto.PostDTO;
import com.ams.entity.ClassPost;
import com.ams.entity.Role;
import com.ams.entity.SubjectClass;
import com.ams.entity.User;
import com.ams.exception.BadRequestException;
import com.ams.exception.ResourceNotFoundException;
import com.ams.repository.ClassPostRepository;
import com.ams.repository.SubjectClassRepository;
import com.ams.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final ClassPostRepository postRepository;
    private final SubjectClassRepository subjectClassRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final ClassMembershipService membershipService;
    private final RoleChecker roleChecker;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<PostDTO.PostResponse> getPostsByClass(Long subjectClassId) {
        User user = currentUser();
        SubjectClass subjectClass = subjectClassRepository.findById(subjectClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + subjectClassId));
        if (!membershipService.isMember(user, subjectClass)) {
            throw new ResourceNotFoundException("You are not a member of this class");
        }
        return postRepository.findBySubjectClassIdOrderByCreatedAtDesc(subjectClassId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PostDTO.PostResponse createPost(Long subjectClassId, PostDTO.CreatePostRequest request, MultipartFile file) throws IOException {
        User user = currentUser();
        SubjectClass subjectClass = subjectClassRepository.findById(subjectClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + subjectClassId));
        if (!membershipService.isMember(user, subjectClass)) {
            throw new BadRequestException("You must be a member of this class to post");
        }

        ClassPost post = ClassPost.builder()
                .subjectClass(subjectClass)
                .author(user)
                .body(request.body())
                .createdAt(LocalDateTime.now())
                .build();

        if (file != null && !file.isEmpty()) {
            Map uploadResult = fileUploadService.uploadFile(file, "class-materials");
            post.setAttachmentReference((String) uploadResult.get("secure_url"));
            post.setAttachmentFilename(file.getOriginalFilename());
            post.setAttachmentSize(file.getSize());
        }

        post = postRepository.save(post);
        auditLogService.log("CLASS_POST_CREATED", "ClassPost", subjectClass.getClassCode() + ":" + post.getId());
        return mapToResponse(post);
    }

    @Transactional
    public void deletePost(Long subjectClassId, Long postId) {
        User user = currentUser();
        SubjectClass subjectClass = subjectClassRepository.findById(subjectClassId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + subjectClassId));
        if (!membershipService.isMember(user, subjectClass)) {
            throw new ResourceNotFoundException("You are not a member of this class");
        }

        ClassPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        if (post.getSubjectClass().getId().equals(subjectClassId)
                && (post.getAuthor().getId().equals(user.getId())
                    || roleChecker.hasRole(user.getId(), Role.RoleName.ADMIN, Role.RoleName.TEACHER, Role.RoleName.EXPERT))) {
            postRepository.delete(post);
            auditLogService.log("CLASS_POST_DELETED", "ClassPost", subjectClass.getClassCode() + ":" + postId);
        } else {
            throw new BadRequestException("You can only delete your own posts");
        }
    }

    private User currentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private PostDTO.PostResponse mapToResponse(ClassPost p) {
        return new PostDTO.PostResponse(
                p.getId(),
                p.getSubjectClass().getId(),
                p.getSubjectClass().getClassCode(),
                p.getAuthor().getId(),
                p.getAuthor().getFullName(),
                p.getBody(),
                p.getAttachmentReference(),
                p.getAttachmentFilename(),
                p.getAttachmentSize(),
                p.getCreatedAt()
        );
    }
}
