package com.aismartcivic.common.dto;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PageResponseTest {

    @Test
    void fromMapsPageContentAndMetadata() {
        Page<Integer> page = new PageImpl<>(List.of(1, 2), PageRequest.of(0, 2), 5);

        PageResponse<String> response = PageResponse.from(page, value -> "n-" + value);

        assertThat(response.content()).containsExactly("n-1", "n-2");
        assertThat(response.page()).isZero();
        assertThat(response.size()).isEqualTo(2);
        assertThat(response.totalElements()).isEqualTo(5);
        assertThat(response.totalPages()).isEqualTo(3);
    }

    @Test
    void errorResponseHoldsContractFields() {
        Instant now = Instant.parse("2026-09-11T17:00:00Z");
        ApiErrorResponse body = new ApiErrorResponse(
                now,
                400,
                "Invalid complaint status transition",
                "/api/officer/complaints/1/status"
        );

        assertThat(body.status()).isEqualTo(400);
        assertThat(body.message()).isEqualTo("Invalid complaint status transition");
        assertThat(body.path()).isEqualTo("/api/officer/complaints/1/status");
        assertThat(body.timestamp()).isEqualTo(now);
    }
}
