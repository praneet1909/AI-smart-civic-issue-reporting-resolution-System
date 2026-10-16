package com.aismartcivic.bootstrap;

import com.aismartcivic.domain.IssueCategoryCatalog;
import com.aismartcivic.domain.entity.Department;
import com.aismartcivic.repository.DepartmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(1)
public class DepartmentSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DepartmentSeeder.class);

    private final DepartmentRepository departmentRepository;

    public DepartmentSeeder(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int created = 0;
        for (IssueCategoryCatalog.CategoryDefinition definition : IssueCategoryCatalog.all()) {
            if (departmentRepository.existsByName(definition.departmentName())) {
                continue;
            }
            departmentRepository.save(new Department(definition.departmentName(), definition.departmentDescription()));
            created++;
        }
        log.info("Department seed complete. created={}, total={}", created, departmentRepository.count());
    }
}
