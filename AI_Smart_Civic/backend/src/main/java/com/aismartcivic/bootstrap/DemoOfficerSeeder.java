package com.aismartcivic.bootstrap;

import com.aismartcivic.domain.entity.Department;
import com.aismartcivic.domain.entity.User;
import com.aismartcivic.domain.enums.Role;
import com.aismartcivic.repository.DepartmentRepository;
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
@Order(3)
@Profile({"dev", "docker"})
public class DemoOfficerSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoOfficerSeeder.class);
    static final String OFFICER_EMAIL = "officer.roads@aismartcivic.local";

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final String officerPassword;

    public DemoOfficerSeeder(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.officer-password}") String officerPassword
    ) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.officerPassword = officerPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(OFFICER_EMAIL)) {
            return;
        }
        Department roads = departmentRepository.findByName("Road Maintenance")
                .orElseThrow(() -> new IllegalStateException("Road Maintenance department missing"));
        User officer = new User();
        officer.setName("Roads Officer");
        officer.setEmail(OFFICER_EMAIL);
        officer.setPassword(passwordEncoder.encode(officerPassword));
        officer.setRole(Role.OFFICER);
        officer.setEnabled(true);
        officer.setDepartment(roads);
        userRepository.save(officer);
        log.info("Demo officer seeded: {}", OFFICER_EMAIL);
    }
}
