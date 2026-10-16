package com.aismartcivic.repository;

import com.aismartcivic.domain.entity.User;
import com.aismartcivic.domain.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findByRoleAndDepartmentId(Role role, Long departmentId);
}
