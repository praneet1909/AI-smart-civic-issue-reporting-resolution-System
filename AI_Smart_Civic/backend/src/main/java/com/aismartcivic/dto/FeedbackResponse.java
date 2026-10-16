package com.aismartcivic.dto;

import java.time.Instant;

public record FeedbackResponse(
        Long id,
        Long complaintId,
        Long citizenId,
        String citizenName,
        int rating,
        String comment,
        Instant createdAt
) {
}
