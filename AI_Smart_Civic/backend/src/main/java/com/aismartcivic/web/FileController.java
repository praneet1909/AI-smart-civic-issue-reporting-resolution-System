package com.aismartcivic.web;

import com.aismartcivic.service.FileStorageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @GetMapping("/{folder}/{filename}")
    public ResponseEntity<byte[]> get(@PathVariable String folder, @PathVariable String filename) {
        byte[] bytes = fileStorageService.load(folder + "/" + filename);
        MediaType mediaType = mediaType(filename);
        return ResponseEntity.ok().contentType(mediaType).body(bytes);
    }

    private MediaType mediaType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (lower.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.IMAGE_JPEG;
    }
}
