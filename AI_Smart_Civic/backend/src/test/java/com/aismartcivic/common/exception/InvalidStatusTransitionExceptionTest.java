package com.aismartcivic.common.exception;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InvalidStatusTransitionExceptionTest {

    @Test
    void ofBuildsStableClientMessage() {
        InvalidStatusTransitionException ex = InvalidStatusTransitionException.of("REPORTED", "CLOSED");

        assertThat(ex.getStatus().value()).isEqualTo(400);
        assertThat(ex.getMessage()).isEqualTo("Invalid complaint status transition from REPORTED to CLOSED");
    }
}
