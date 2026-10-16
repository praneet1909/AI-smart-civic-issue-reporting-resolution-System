package com.aismartcivic.dto;

import com.aismartcivic.domain.enums.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateOfficerStatusRequest(
        @NotNull(message = "Status is required")
        ComplaintStatus status,

        @Size(max = 1000, message = "Remarks cannot exceed 1000 characters")
        String remarks
) {
}
