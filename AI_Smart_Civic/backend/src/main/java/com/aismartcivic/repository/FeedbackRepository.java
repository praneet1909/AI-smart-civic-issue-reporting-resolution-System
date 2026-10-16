package com.aismartcivic.repository;

import com.aismartcivic.domain.entity.Feedback;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    @EntityGraph(attributePaths = {"complaint", "citizen"})
    Optional<Feedback> findByComplaintId(Long complaintId);

    boolean existsByComplaintId(Long complaintId);
}

