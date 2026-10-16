package com.aismartcivic.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    String store(String folder, MultipartFile file);

    byte[] load(String relativePath);
}
