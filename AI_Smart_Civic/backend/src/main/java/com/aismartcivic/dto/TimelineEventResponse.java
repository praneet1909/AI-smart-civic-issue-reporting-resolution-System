package com.aismartcivic.dto;

import com.aismartcivic.domain.enums.ComplaintStatus;

import java.time.Instant;

public record TimelineEventResponse(
        ComplaintStatus oldStatus,
        ComplaintStatus newStatus,
        String changedByName,
        String remarks,
        Instant changedAt
) {
}
