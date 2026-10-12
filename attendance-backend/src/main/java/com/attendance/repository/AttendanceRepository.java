package com.attendance.repository;

import com.attendance.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByStudentId(Long studentId);
    List<AttendanceRecord> findByStudentRollNumber(String rollNumber);
    List<AttendanceRecord> findByDate(LocalDate date);
}
