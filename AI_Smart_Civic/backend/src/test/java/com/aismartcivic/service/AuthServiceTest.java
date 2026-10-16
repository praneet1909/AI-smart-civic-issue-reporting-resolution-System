package com.aismartcivic.service;

import com.aismartcivic.common.exception.DuplicateResourceException;
import com.aismartcivic.common.exception.ForbiddenOperationException;
import com.aismartcivic.common.exception.UnauthorizedException;
import com.aismartcivic.domain.entity.User;
import com.aismartcivic.domain.enums.Role;
import com.aismartcivic.dto.LoginRequest;
import com.aismartcivic.dto.LoginResponse;
import com.aismartcivic.dto.RegisterRequest;
import com.aismartcivic.dto.UserResponse;
import com.aismartcivic.mapper.UserMapper;
import com.aismartcivic.repository.UserRepository;
import com.aismartcivic.security.JwtProperties;
import com.aismartcivic.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("unit-test-jwt-secret-key-32chars-min");
        properties.setExpirationMs(3_600_000L);
        jwtService = new JwtService(properties);
        jwtService.init();
        authService = new AuthService(userRepository, passwordEncoder, jwtService, new UserMapper());
    }

    @Test
    void registerCitizenHashesPasswordAndDoesNotExposeIt() {
        RegisterRequest request = new RegisterRequest("Ada Citizen", "Ada@Example.com", "Password1", "9876543210");
        when(userRepository.existsByEmail("ada@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password1")).thenReturn("$2a$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = authService.registerCitizen(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("$2a$hashed");
        assertThat(captor.getValue().getRole()).isEqualTo(Role.CITIZEN);
        assertThat(captor.getValue().getEmail()).isEqualTo("ada@example.com");
        assertThat(response.email()).isEqualTo("ada@example.com");
        assertThat(response.role()).isEqualTo(Role.CITIZEN);
    }

    @Test
    void registerRejectsDuplicateEmail() {
        when(userRepository.existsByEmail("ada@example.com")).thenReturn(true);
        RegisterRequest request = new RegisterRequest("Ada", "ada@example.com", "Password1", null);

        assertThatThrownBy(() -> authService.registerCitizen(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Email is already registered");
    }

    @Test
    void loginReturnsJwtWithoutPassword() {
        User user = enabledUser("citizen@example.com", "$2a$hashed");
        when(userRepository.findByEmail("citizen@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password1", "$2a$hashed")).thenReturn(true);
        setUserId(user, 9L);

        LoginResponse response = authService.login(new LoginRequest("Citizen@Example.com", "Password1"));

        assertThat(response.token()).isNotBlank();
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.user().email()).isEqualTo("citizen@example.com");
        assertThat(jwtService.isValid(response.token())).isTrue();
        assertThat(jwtService.extractUserId(response.token())).isEqualTo(9L);
    }

    @Test
    void loginRejectsUnknownUser() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("missing@example.com", "Password1")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void loginRejectsWrongPassword() {
        User user = enabledUser("citizen@example.com", "$2a$hashed");
        when(userRepository.findByEmail("citizen@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "$2a$hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("citizen@example.com", "wrong")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void loginRejectsDisabledAccount() {
        User user = enabledUser("citizen@example.com", "$2a$hashed");
        user.setEnabled(false);
        when(userRepository.findByEmail("citizen@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password1", "$2a$hashed")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(new LoginRequest("citizen@example.com", "Password1")))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessage("Account is disabled");
    }

    private User enabledUser(String email, String passwordHash) {
        User user = new User();
        user.setName("Citizen");
        user.setEmail(email);
        user.setPassword(passwordHash);
        user.setRole(Role.CITIZEN);
        user.setEnabled(true);
        return user;
    }

    private void setUserId(User user, Long id) {
        try {
            var field = User.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, id);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
