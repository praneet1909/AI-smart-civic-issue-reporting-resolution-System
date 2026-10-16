package com.aismartcivic.dto;

import com.aismartcivic.domain.enums.Role;

import java.time.Instant;

public record UserResponse(
        Long id,
        String name,
        String email,
        String phone,
        Role role,
        boolean enabled,
        Long departmentId,
        String departmentName,
        Instant createdAt
) {
}
