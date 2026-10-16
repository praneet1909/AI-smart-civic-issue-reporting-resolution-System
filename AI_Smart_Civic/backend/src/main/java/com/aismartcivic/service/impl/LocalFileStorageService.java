package com.aismartcivic.service.impl;

import com.aismartcivic.common.exception.InvalidFileException;
import com.aismartcivic.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_BYTES = 10L * 1024 * 1024;

    private final Path root;

    public LocalFileStorageService(@Value("${file.storage-path}") String storagePath) {
        this.root = Path.of(storagePath).toAbsolutePath().normalize();
    }

    @Override
    public String store(String folder, MultipartFile file) {
        validate(file);
        String extension = extensionFor(file);
        String relative = folder + "/" + UUID.randomUUID() + extension;
        Path target = root.resolve(relative).normalize();
        if (!target.startsWith(root)) {
            throw new InvalidFileException("Invalid file path");
        }
        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
            return relative.replace('\\', '/');
        } catch (IOException ex) {
            throw new InvalidFileException("Unable to store uploaded file");
        }
    }

    @Override
    public byte[] load(String relativePath) {
        Path target = root.resolve(relativePath).normalize();
        if (!target.startsWith(root) || !Files.isRegularFile(target)) {
            throw new InvalidFileException("File not found");
        }
        try {
            return Files.readAllBytes(target);
        } catch (IOException ex) {
            throw new InvalidFileException("Unable to read file");
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Image file is required");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new InvalidFileException("Uploaded file exceeds the allowed size");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.contains(contentType) || !matchesMagic(file)) {
            throw new InvalidFileException("Only JPEG, PNG, or WEBP images are allowed");
        }
    }

    private boolean matchesMagic(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            byte[] header = in.readNBytes(12);
            if (header.length >= 3 && header[0] == (byte) 0xFF && header[1] == (byte) 0xD8 && header[2] == (byte) 0xFF) {
                return true;
            }
            if (header.length >= 8
                    && header[0] == (byte) 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) {
                return true;
            }
            return header.length >= 12
                    && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                    && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
        } catch (IOException ex) {
            return false;
        }
    }

    private String extensionFor(MultipartFile file) {
        String contentType = file.getContentType().toLowerCase(Locale.ROOT);
        if (contentType.contains("png")) {
            return ".png";
        }
        if (contentType.contains("webp")) {
            return ".webp";
        }
        return ".jpg";
    }
}
