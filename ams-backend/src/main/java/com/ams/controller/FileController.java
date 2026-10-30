package com.ams.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Value("${file.storage.path:./storage/files}")
    private String storagePath;

    @GetMapping("/{*path}")
    public ResponseEntity<Resource> download(@PathVariable String path) {
        // {*path} captures the segment with a leading slash; strip it before resolving
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        Path root = Paths.get(storagePath).toAbsolutePath().normalize();
        Path target = root.resolve(path).normalize();

        // Path-traversal guard: the resolved file must stay inside the storage root
        if (!target.startsWith(root)) {
            return ResponseEntity.notFound().build();
        }

        FileSystemResource resource = new FileSystemResource(target);
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String fileName = path.substring(path.lastIndexOf('/') + 1);
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(detectContentType(fileName))
                .body(resource);
    }

    private MediaType detectContentType(String fileName) {
        int dot = fileName.lastIndexOf('.');
        String ext = dot >= 0 ? fileName.substring(dot + 1).toLowerCase() : "";
        return switch (ext) {
            case "png" -> MediaType.IMAGE_PNG;
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "gif" -> MediaType.IMAGE_GIF;
            case "pdf" -> MediaType.APPLICATION_PDF;
            case "zip" -> MediaType.parseMediaType("application/zip");
            case "txt", "md", "csv" -> MediaType.parseMediaType("text/plain");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
}
