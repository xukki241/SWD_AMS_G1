package com.ams.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Value("${file.storage.path:./storage/files}")
    private String storagePath;

    /**
     * Demo / seed submission downloads. Generates a small placeholder file so teachers
     * can practice grading without requiring real Cloudinary assets.
     */
    @GetMapping("/demo/{fileName}")
    public ResponseEntity<Resource> downloadDemo(@PathVariable String fileName) {
        String safe = sanitizeFileName(fileName);
        if (safe == null) {
            return ResponseEntity.notFound().build();
        }
        byte[] body = buildDemoBytes(safe);
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safe + "\"");
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(detectContentType(safe))
                .contentLength(body.length)
                .body(new ByteArrayResource(body));
    }

    @GetMapping("/{*path}")
    public ResponseEntity<Resource> download(@PathVariable String path) {
        // {*path} captures the segment with a leading slash; strip it before resolving
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        // /api/files/demo/... is handled by the dedicated mapping; keep a fallback here too.
        if (path.startsWith("demo/")) {
            return downloadDemo(path.substring("demo/".length()));
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

    private static String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) return null;
        String name = fileName.trim();
        if (name.contains("..") || name.contains("/") || name.contains("\\")) return null;
        if (!name.matches("(?i)[a-z0-9._-]+\\.[a-z0-9]+")) return null;
        return name;
    }

    private static byte[] buildDemoBytes(String fileName) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        String note = "AMS Classroom demo submission file: " + fileName
                + "\nThis is a local placeholder for seed data (not a real Cloudinary asset).\n";
        if (lower.endsWith(".pdf")) {
            // Minimal valid PDF so browsers / Word openers don't choke.
            String pdf = """
                    %%PDF-1.1
                    1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
                    2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
                    3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
                    4 0 obj<< /Length 68 >>stream
                    BT /F1 12 Tf 20 100 Td (AMS demo submission) Tj ET
                    endstream
                    endobj
                    5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
                    xref
                    0 6
                    0000000000 65535 f\s
                    0000000009 00000 n\s
                    0000000058 00000 n\s
                    0000000115 00000 n\s
                    0000000266 00000 n\s
                    0000000384 00000 n\s
                    trailer<< /Size 6 /Root 1 0 R >>
                    startxref
                    461
                    %%%%EOF
                    """;
            return pdf.replace("\n", "\r\n").getBytes(StandardCharsets.US_ASCII);
        }
        return note.getBytes(StandardCharsets.UTF_8);
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
            case "docx" -> MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            case "doc" -> MediaType.parseMediaType("application/msword");
            case "txt", "md", "csv" -> MediaType.parseMediaType("text/plain");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }
}
