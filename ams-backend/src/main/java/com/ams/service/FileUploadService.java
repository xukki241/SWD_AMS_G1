package com.ams.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class FileUploadService {

    private final Cloudinary cloudinary;

    @Value("${file.storage.path:./storage/files}")
    private String storagePath;

    @Value("${file.storage.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    public FileUploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public Map uploadFile(MultipartFile file, String folder) throws IOException {
        String originalFilename = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        log.info("Uploading file '{}' to folder '{}'", originalFilename, folder);

        if (isCloudinaryConfigured()) {
            try {
                String resourceType = resolveResourceType(originalFilename, file.getContentType());
                Map uploadParams = ObjectUtils.asMap(
                        "folder", "ams/" + folder,
                        "resource_type", resourceType,
                        "use_filename", true,
                        "unique_filename", true,
                        "overwrite", false
                );
                Map result = cloudinary.uploader().upload(file.getBytes(), uploadParams);
                Object url = result.get("secure_url");
                if (url != null && StringUtils.hasText(String.valueOf(url))) {
                    return result;
                }
                log.warn("Cloudinary returned empty secure_url; falling back to local storage");
            } catch (Exception e) {
                log.warn("Cloudinary upload failed ({}); storing locally instead", e.getMessage());
            }
        } else {
            log.warn("Cloudinary is not configured; storing '{}' locally", originalFilename);
        }
        return saveLocally(file, folder, originalFilename);
    }

    private boolean isCloudinaryConfigured() {
        return StringUtils.hasText(cloudName)
                && StringUtils.hasText(apiKey)
                && StringUtils.hasText(apiSecret);
    }

    /** Images → image; video → video; everything else (pdf/docx/zip) → raw. */
    private static String resolveResourceType(String filename, String contentType) {
        String type = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        if (type.startsWith("image/")) return "image";
        if (type.startsWith("video/")) return "video";
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                || lower.endsWith(".gif") || lower.endsWith(".webp")) {
            return "image";
        }
        return "raw";
    }

    private Map saveLocally(MultipartFile file, String folder, String originalFilename) throws IOException {
        String ext = "";
        int dot = originalFilename.lastIndexOf('.');
        if (dot >= 0 && dot < originalFilename.length() - 1) {
            ext = originalFilename.substring(dot + 1).toLowerCase(Locale.ROOT);
        }
        String safeExt = ext.replaceAll("[^a-z0-9]", "");
        String name = UUID.randomUUID() + (safeExt.isEmpty() ? "" : "." + safeExt);

        Path dir = Paths.get(storagePath, "ams", folder).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        Path target = dir.resolve(name);
        Files.write(target, file.getBytes());

        Map result = new HashMap<>();
        result.put("secure_url", baseUrl + "/api/files/ams/" + folder + "/" + name);
        result.put("public_id", "ams/" + folder + "/" + name);
        result.put("format", safeExt.isEmpty() ? "file" : safeExt);
        result.put("bytes", file.getSize());
        result.put("original_filename", originalFilename);
        return result;
    }
}
