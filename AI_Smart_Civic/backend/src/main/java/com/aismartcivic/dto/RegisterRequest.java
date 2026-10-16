package com.aismartcivic.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 120, message = "Name must be between 2 and 120 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 180)
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        String password,

        @Size(max = 20, message = "Phone must be at most 20 characters")
        @Pattern(regexp = "^$|^[+0-9][0-9\\-\\s]{6,19}$", message = "Phone must be a valid number")
        String phone
) {
}
