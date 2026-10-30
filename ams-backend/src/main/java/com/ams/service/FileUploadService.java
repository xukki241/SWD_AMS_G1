package com.ams.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
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

    public FileUploadService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public Map uploadFile(MultipartFile file, String folder) throws IOException {
        String originalFilename = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        log.info("Uploading file '{}' to Cloudinary folder '{}'", originalFilename, folder);

        try {
            Map uploadParams = ObjectUtils.asMap(
                    "folder", "ams/" + folder,
                    "resource_type", "auto"
            );
            return cloudinary.uploader().upload(file.getBytes(), uploadParams);
        } catch (Exception e) {
            // Cloudinary credentials may be invalid/absent (POC) - fall back to local disk
            log.warn("Cloudinary upload failed ({}); storing locally instead", e.getMessage());
            return saveLocally(file, folder, originalFilename);
        }
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
        return result;
    }
}
