package com.ams.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.net.URI;
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

    public record AiFileContent(String mimeType, byte[] bytes, String text) {}

    public AiFileContent readSubmissionForAi(String secureUrl) {
        try {
            URI uri = new URI(secureUrl);
            String fileName = Paths.get(uri.getPath()).getFileName().toString();
            String lower = fileName.toLowerCase(Locale.ROOT);
            byte[] bytes;
            URI configuredBase = new URI(baseUrl);
            if (uri.getHost() != null && uri.getHost().equalsIgnoreCase(configuredBase.getHost())) {
                if (!uri.getPath().startsWith("/api/files/ams/submissions/")) {
                    throw new IllegalArgumentException("Not a submission file path");
                }
                Path target = Paths.get(storagePath, "ams", "submissions", fileName).toAbsolutePath().normalize();
                Path root = Paths.get(storagePath, "ams", "submissions").toAbsolutePath().normalize();
                if (!target.startsWith(root) || !Files.isReadable(target)) throw new IllegalArgumentException("Submission file is unavailable");
                bytes = Files.readAllBytes(target);
            } else if (uri.getHost() != null && uri.getHost().toLowerCase(Locale.ROOT).endsWith(".cloudinary.com")) {
                bytes = RestClient.create().get().uri(uri).retrieve().body(byte[].class);
            } else {
                throw new IllegalArgumentException("Submission file host is not trusted");
            }
            if (bytes == null || bytes.length == 0 || bytes.length > 10 * 1024 * 1024) {
                throw new IllegalArgumentException("Submission file is empty or exceeds 10 MB");
            }
            if (lower.endsWith(".pdf")) return new AiFileContent("application/pdf", bytes, null);
            if (lower.endsWith(".png")) return new AiFileContent("image/png", bytes, null);
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return new AiFileContent("image/jpeg", bytes, null);
            if (lower.endsWith(".webp")) return new AiFileContent("image/webp", bytes, null);
            if (lower.endsWith(".gif")) return new AiFileContent("image/gif", bytes, null);
            if (lower.endsWith(".docx")) return new AiFileContent("text/plain", bytes, extractOfficeText(bytes, "word/document.xml"));
            if (lower.endsWith(".pptx")) return new AiFileContent("text/plain", bytes, extractOfficeText(bytes, "ppt/slides/slide"));
            if (lower.endsWith(".zip")) return new AiFileContent("text/plain", bytes, extractArchiveText(bytes));
            if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".csv")) {
                return new AiFileContent("text/plain", bytes, new String(bytes, java.nio.charset.StandardCharsets.UTF_8));
            }
            throw new IllegalArgumentException("AI grading supports PDF, images, text, DOCX, PPTX, and text-containing ZIP files. This file can still be graded manually.");
        } catch (Exception ex) {
            if (ex instanceof IllegalArgumentException illegal) throw illegal;
            throw new IllegalArgumentException("Could not read the submission file for AI grading", ex);
        }
    }

    private static String extractOfficeText(byte[] bytes, String entryPrefix) throws Exception {
        java.util.List<String> parts = new java.util.ArrayList<>();
        long totalExpanded = 0;
        try (java.util.zip.ZipInputStream zip = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(bytes))) {
            java.util.zip.ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (entry.getName().equals(entryPrefix) || (entryPrefix.endsWith("slide")
                        && entry.getName().startsWith(entryPrefix) && entry.getName().endsWith(".xml"))) {
                    byte[] xml = zip.readNBytes(10 * 1024 * 1024 + 1);
                    totalExpanded += xml.length;
                    if (xml.length > 10 * 1024 * 1024 || totalExpanded > 20 * 1024 * 1024) {
                        throw new IllegalArgumentException("Office document expands beyond the AI reading limit");
                    }
                    javax.xml.parsers.DocumentBuilderFactory factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
                    factory.setNamespaceAware(true);
                    factory.setFeature(javax.xml.XMLConstants.FEATURE_SECURE_PROCESSING, true);
                    factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
                    factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
                    factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
                    org.w3c.dom.Document document = factory.newDocumentBuilder()
                            .parse(new java.io.ByteArrayInputStream(xml));
                    org.w3c.dom.NodeList texts = document.getElementsByTagNameNS("*", "t");
                    StringBuilder slide = new StringBuilder();
                    for (int i = 0; i < texts.getLength(); i++) {
                        if (slide.length() > 0) slide.append(' ');
                        slide.append(texts.item(i).getTextContent());
                    }
                    if (!slide.isEmpty()) parts.add(slide.toString());
                }
            }
        }
        if (parts.isEmpty()) throw new IllegalArgumentException("No readable text was found in the Office document");
        String result = String.join("\n", parts);
        if (result.length() > 100_000) throw new IllegalArgumentException("Office document contains more text than the AI reading limit");
        return result;
    }

    private static String extractArchiveText(byte[] bytes) throws IOException {
        java.util.Set<String> readableExtensions = java.util.Set.of(
                ".txt", ".md", ".csv", ".java", ".js", ".ts", ".tsx", ".jsx", ".py", ".html", ".css", ".json", ".xml", ".sql"
        );
        java.util.List<String> files = new java.util.ArrayList<>();
        long totalExpanded = 0;
        try (java.util.zip.ZipInputStream zip = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(bytes))) {
            java.util.zip.ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String name = entry.getName();
                int slash = name.lastIndexOf('/');
                String leaf = name.substring(slash + 1).toLowerCase(Locale.ROOT);
                int dot = leaf.lastIndexOf('.');
                String extension = dot < 0 ? "" : leaf.substring(dot);
                boolean readable = !entry.isDirectory() && readableExtensions.contains(extension);
                java.io.ByteArrayOutputStream content = readable ? new java.io.ByteArrayOutputStream() : null;
                long entrySize = 0;
                byte[] buffer = new byte[8192];
                int count;
                while ((count = zip.read(buffer)) != -1) {
                    totalExpanded += count;
                    entrySize += count;
                    if (totalExpanded > 10 * 1024 * 1024) {
                        throw new IllegalArgumentException("Archive expands beyond the AI reading limit");
                    }
                    if (readable && entrySize <= 1024 * 1024) content.write(buffer, 0, count);
                    else readable = false;
                }
                if (readable) files.add("--- " + name + " ---\n" + content.toString(java.nio.charset.StandardCharsets.UTF_8));
            }
        }
        if (files.isEmpty()) throw new IllegalArgumentException("No readable text files were found in the archive");
        String result = String.join("\n", files);
        if (result.length() > 100_000) throw new IllegalArgumentException("Archive contains more text than the AI reading limit");
        return result;
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
