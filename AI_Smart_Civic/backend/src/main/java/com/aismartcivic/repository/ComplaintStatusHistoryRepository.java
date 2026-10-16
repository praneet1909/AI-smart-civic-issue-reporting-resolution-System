package com.aismartcivic.repository;

import com.aismartcivic.domain.entity.ComplaintStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ComplaintStatusHistoryRepository extends JpaRepository<ComplaintStatusHistory, Long> {

    @Query("""
            select h from ComplaintStatusHistory h
            left join fetch h.changedBy
            where h.complaint.id = :complaintId
            order by h.changedAt asc
            """)
    List<ComplaintStatusHistory> findByComplaintIdOrderByChangedAtAsc(@Param("complaintId") Long complaintId);
}
