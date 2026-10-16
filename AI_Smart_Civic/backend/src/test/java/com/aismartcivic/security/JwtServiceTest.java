package com.aismartcivic.security;

import com.aismartcivic.domain.entity.User;
import com.aismartcivic.domain.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("unit-test-jwt-secret-key-32chars-min");
        properties.setExpirationMs(3_600_000L);
        jwtService = new JwtService(properties);
        jwtService.init();
    }

    @Test
    void generateAndParseTokenRoundTrip() {
        User user = new User();
        user.setName("Citizen");
        user.setEmail("citizen@example.com");
        user.setPassword("hashed");
        user.setRole(Role.CITIZEN);
        user.setEnabled(true);
        setUserId(user, 42L);

        String token = jwtService.generateToken(user);

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtService.extractEmail(token)).isEqualTo("citizen@example.com");
        assertThat(jwtService.extractRole(token)).isEqualTo(Role.CITIZEN);
        assertThat(token).doesNotContain("hashed");
    }

    @Test
    void rejectsBlankSecret() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("short");
        JwtService service = new JwtService(properties);
        assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void invalidTokenIsNotValid() {
        assertThat(jwtService.isValid("not-a-jwt")).isFalse();
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
