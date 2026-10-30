package com.ams.controller;

import com.ams.dto.PostDTO;
import com.ams.exception.BadRequestException;
import com.ams.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/classes/{classId}/posts")
@RequiredArgsConstructor
@Tag(name = "Class Stream", description = "Posts and material sharing inside a class (members only)")
public class PostController {

    private final PostService postService;

    @GetMapping
    @Operation(summary = "List posts for a class, newest first")
    public List<PostDTO.PostResponse> getPosts(@PathVariable Long classId) {
        return postService.getPostsByClass(classId);
    }

    @PostMapping(consumes = "multipart/form-data")
    @Operation(summary = "Create a post with an optional file attachment")
    public ResponseEntity<PostDTO.PostResponse> createPost(
            @PathVariable Long classId,
            @RequestParam(value = "body", required = false) String body,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        boolean hasFile = file != null && !file.isEmpty();
        String message = (body == null || body.isBlank())
                ? (hasFile ? "Shared material: " + file.getOriginalFilename() : "")
                : body;
        if (message.isBlank() && !hasFile) {
            throw new BadRequestException("Post requires text or an attachment");
        }

        PostDTO.PostResponse response = postService.createPost(classId, new PostDTO.CreatePostRequest(message), file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{postId}")
    @Operation(summary = "Delete a post (author or class staff)")
    public ResponseEntity<Void> deletePost(@PathVariable Long classId, @PathVariable Long postId) {
        postService.deletePost(classId, postId);
        return ResponseEntity.noContent().build();
    }
}
