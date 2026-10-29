package com.ams.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final Cloudinary cloudinary;

    public Map uploadFile(MultipartFile file, String folder) throws IOException {
        String originalFilename = file.getOriginalFilename();
        log.info("Uploading file '{}' to Cloudinary folder '{}'", originalFilename, folder);

        Map uploadParams = ObjectUtils.asMap(
                "folder", "ams/" + folder,
                "resource_type", "auto"
        );

        return cloudinary.uploader().upload(file.getBytes(), uploadParams);
    }
}
