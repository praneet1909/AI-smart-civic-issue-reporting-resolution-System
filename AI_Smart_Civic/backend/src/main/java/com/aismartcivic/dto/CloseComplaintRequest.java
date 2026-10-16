package com.aismartcivic.dto;

import jakarta.validation.constraints.Size;

public record CloseComplaintRequest(
        @Size(max = 1000, message = "Remarks cannot exceed 1000 characters")
        String remarks
) {
}
