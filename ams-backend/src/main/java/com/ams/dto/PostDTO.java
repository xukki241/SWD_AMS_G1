package com.ams.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class PostDTO {

    public record PostResponse(
            Long id,
            Long subjectClassId,
            String classCode,
            Long authorId,
            String authorName,
            String body,
            String attachmentReference,
            String attachmentFilename,
            Long attachmentSize,
            LocalDateTime createdAt
    ) {}

    public record CreatePostRequest(
            @NotBlank String body
    ) {}
}
