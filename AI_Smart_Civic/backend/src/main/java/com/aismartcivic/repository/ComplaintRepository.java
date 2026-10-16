package com.aismartcivic.repository;

import com.aismartcivic.domain.entity.Complaint;
import com.aismartcivic.domain.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long>, JpaSpecificationExecutor<Complaint> {

    Optional<Complaint> findByComplaintNumber(String complaintNumber);

    long countByComplaintNumberStartingWith(String prefix);

    @EntityGraph(attributePaths = {"citizen", "department", "officer"})
    @Query("select c from Complaint c")
    Page<Complaint> findAllDetailed(Pageable pageable);

    @EntityGraph(attributePaths = {"citizen", "department", "officer"})
    Page<Complaint> findByCitizenId(Long citizenId, Pageable pageable);

    @EntityGraph(attributePaths = {"citizen", "department", "officer"})
    Page<Complaint> findByOfficerId(Long officerId, Pageable pageable);

    @EntityGraph(attributePaths = {"citizen", "department", "officer"})
    Page<Complaint> findByOfficerIdAndStatus(Long officerId, ComplaintStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"citizen", "department", "officer"})
    @Query("select c from Complaint c where c.id = :id")
    Optional<Complaint> findDetailedById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"citizen", "department", "officer"})
    @Query("select c from Complaint c where c.id = :id and c.citizen.id = :citizenId")
    Optional<Complaint> findDetailedByIdAndCitizenId(@Param("id") Long id, @Param("citizenId") Long citizenId);

    @EntityGraph(attributePaths = {"citizen", "department", "officer"})
    @Query("select c from Complaint c where c.id = :id and c.officer.id = :officerId")
    Optional<Complaint> findDetailedByIdAndOfficerId(@Param("id") Long id, @Param("officerId") Long officerId);

    Optional<Complaint> findByIdAndCitizenId(Long id, Long citizenId);

    Optional<Complaint> findByIdAndOfficerId(Long id, Long officerId);

    long countByCitizenId(Long citizenId);

    long countByCitizenIdAndStatus(Long citizenId, ComplaintStatus status);

    long countByOfficerId(Long officerId);

    long countByOfficerIdAndStatus(Long officerId, ComplaintStatus status);

    long countByStatus(ComplaintStatus status);
}
