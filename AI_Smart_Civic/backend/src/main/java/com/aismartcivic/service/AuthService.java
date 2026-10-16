package com.aismartcivic.service;

import com.aismartcivic.common.exception.DuplicateResourceException;
import com.aismartcivic.common.exception.ForbiddenOperationException;
import com.aismartcivic.common.exception.ResourceNotFoundException;
import com.aismartcivic.common.exception.UnauthorizedException;
import com.aismartcivic.domain.entity.User;
import com.aismartcivic.domain.enums.Role;
import com.aismartcivic.dto.LoginRequest;
import com.aismartcivic.dto.LoginResponse;
import com.aismartcivic.dto.RegisterRequest;
import com.aismartcivic.dto.UserResponse;
import com.aismartcivic.mapper.UserMapper;
import com.aismartcivic.repository.UserRepository;
import com.aismartcivic.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UserMapper userMapper
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
    }

    @Transactional
    public UserResponse registerCitizen(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email is already registered");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setPhone(normalizePhone(request.phone()));
        user.setRole(Role.CITIZEN);
        user.setEnabled(true);

        User saved = userRepository.save(user);
        log.info("Citizen registered: {}", saved.getEmail());
        return userMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> unauthorizedLogin(email));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw unauthorizedLogin(email);
        }
        if (!user.isEnabled()) {
            log.warn("Disabled user login attempt: {}", email);
            throw new ForbiddenOperationException("Account is disabled");
        }

        String token = jwtService.generateToken(user);
        log.info("User login success: {} role={}", email, user.getRole());
        return new LoginResponse(token, "Bearer", jwtService.getExpirationMs(), userMapper.toResponse(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return userMapper.toResponse(user);
    }

    private UnauthorizedException unauthorizedLogin(String email) {
        log.warn("Failed login attempt for email: {}", email);
        return new UnauthorizedException("Invalid email or password");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String trimmed = phone.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
