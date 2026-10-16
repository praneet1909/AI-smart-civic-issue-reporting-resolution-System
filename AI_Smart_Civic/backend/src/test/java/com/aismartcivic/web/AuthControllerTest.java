package com.aismartcivic.web;

import com.aismartcivic.common.exception.GlobalExceptionHandler;
import com.aismartcivic.domain.enums.Role;
import com.aismartcivic.dto.LoginRequest;
import com.aismartcivic.dto.LoginResponse;
import com.aismartcivic.dto.RegisterRequest;
import com.aismartcivic.dto.UserResponse;
import com.aismartcivic.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(new StubAuthService()))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void registerReturnsCreatedUserWithoutPassword() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Ada Citizen",
                                  "email": "ada@example.com",
                                  "password": "Password1",
                                  "phone": "9876543210"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("ada@example.com"))
                .andExpect(jsonPath("$.role").value("CITIZEN"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void loginReturnsTokenAndUser() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "ada@example.com",
                                  "password": "Password1"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.role").value("CITIZEN"))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    void registerValidatesMissingFields() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    private static final class StubAuthService extends AuthService {
        private StubAuthService() {
            super(null, null, null, null);
        }

        @Override
        public UserResponse registerCitizen(RegisterRequest request) {
            return new UserResponse(
                    1L, request.name(), request.email(), request.phone(),
                    Role.CITIZEN, true, null, null, Instant.parse("2026-09-20T07:00:00Z")
            );
        }

        @Override
        public LoginResponse login(LoginRequest request) {
            UserResponse user = new UserResponse(
                    1L, "Ada Citizen", request.email(), null,
                    Role.CITIZEN, true, null, null, Instant.parse("2026-09-20T07:00:00Z")
            );
            return new LoginResponse("jwt-token", "Bearer", 3600000L, user);
        }
    }
}
