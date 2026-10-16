package com.aismartcivic.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidStatusTransitionException extends ApiException {

    public InvalidStatusTransitionException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }

    public static InvalidStatusTransitionException of(String from, String to) {
        return new InvalidStatusTransitionException(
                "Invalid complaint status transition from " + from + " to " + to);
    }
}
