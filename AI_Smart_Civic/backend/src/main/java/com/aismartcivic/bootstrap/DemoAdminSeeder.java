package com.aismartcivic.bootstrap;

import com.aismartcivic.domain.entity.User;
import com.aismartcivic.domain.enums.Role;
import com.aismartcivic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(2)
@Profile({"dev", "docker"})
public class DemoAdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoAdminSeeder.class);
    static final String ADMIN_EMAIL = "admin@aismartcivic.local";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminPassword;

    public DemoAdminSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.admin-password}") String adminPassword
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            log.info("Demo admin already present: {}", ADMIN_EMAIL);
            return;
        }
        User admin = new User();
        admin.setName("System Administrator");
        admin.setEmail(ADMIN_EMAIL);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        admin.setEnabled(true);
        userRepository.save(admin);
        log.info("Demo admin seeded: {}", ADMIN_EMAIL);
    }
}
