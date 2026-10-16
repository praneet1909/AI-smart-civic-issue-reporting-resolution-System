package com.aismartcivic.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AssignComplaintRequest(
        @NotNull(message = "Officer id is required")
        Long officerId,
        @Size(max = 500)
        String remarks
) {
}
