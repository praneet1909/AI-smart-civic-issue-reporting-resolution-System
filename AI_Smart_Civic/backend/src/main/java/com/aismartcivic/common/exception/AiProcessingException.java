package com.aismartcivic.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Logged internally; citizens receive a generic message via the exception handler.
 */
public class AiProcessingException extends ApiException {

    public AiProcessingException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
