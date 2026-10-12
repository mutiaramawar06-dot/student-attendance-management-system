package com.attendance.controller;

import com.attendance.entity.AttendanceRecord;
import com.attendance.entity.Student;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.StudentRepository;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    public AttendanceController(AttendanceRepository attendanceRepository, StudentRepository studentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
    }

    public static class MarkAttendanceRequest {
        @JsonProperty("studentId")
        @JsonAlias({"student_id", "studentId"})
        public Long studentId;

        @JsonProperty("rollNumber")
        @JsonAlias({"roll_number", "rollNumber"})
        public String rollNumber;

        public String status; // PRESENT, ABSENT, LATE
        public String date; // YYYY-MM-DD

        @JsonProperty("courseName")
        @JsonAlias({"course_name", "courseName"})
        public String courseName;

        public String remarks;
    }

    public static class BulkAttendanceRequest {
        public String date;

        @JsonProperty("courseName")
        @JsonAlias({"course_name", "courseName"})
        public String courseName;

        public List<MarkAttendanceRequest> records;
    }

    @GetMapping
    public List<AttendanceRecord> getAllRecords() {
        return attendanceRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> markAttendance(@RequestBody MarkAttendanceRequest request) {
        Student student = null;
        if (request.studentId != null) {
            student = studentRepository.findById(request.studentId).orElse(null);
        }
        if (student == null && request.rollNumber != null) {
            student = studentRepository.findByRollNumber(request.rollNumber).orElse(null);
        }

        if (student == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Mahasiswa tidak ditemukan di Attendance service. Silakan lakukan sinkronisasi identitas terlebih dahulu.");
        }

        LocalDate recordDate;
        try {
            if (request.date != null && !request.date.trim().isEmpty()) {
                String d = request.date.contains("T") ? request.date.split("T")[0] : request.date.trim();
                recordDate = LocalDate.parse(d);
            } else {
                recordDate = LocalDate.now();
            }
        } catch (Exception e) {
            recordDate = LocalDate.now();
        }

        AttendanceRecord record = AttendanceRecord.builder()
                .student(student)
                .date(recordDate)
                .status(request.status != null ? request.status.toUpperCase() : "PRESENT")
                .courseName(request.courseName != null ? request.courseName : "Cloud Computing")
                .remarks(request.remarks != null ? request.remarks : "-")
                .build();

        AttendanceRecord saved = attendanceRepository.save(record);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> markAttendanceBulk(@RequestBody BulkAttendanceRequest request) {
        if (request.records == null || request.records.isEmpty()) {
            return ResponseEntity.badRequest().body("Daftar presensi kosong");
        }

        List<AttendanceRecord> savedRecords = new ArrayList<>();
        LocalDate recordDate;
        try {
            if (request.date != null && !request.date.trim().isEmpty()) {
                String d = request.date.contains("T") ? request.date.split("T")[0] : request.date.trim();
                recordDate = LocalDate.parse(d);
            } else {
                recordDate = LocalDate.now();
            }
        } catch (Exception e) {
            recordDate = LocalDate.now();
        }

        for (MarkAttendanceRequest item : request.records) {
            Student student = null;
            if (item.studentId != null) {
                student = studentRepository.findById(item.studentId).orElse(null);
            }
            if (student == null && item.rollNumber != null) {
                student = studentRepository.findByRollNumber(item.rollNumber).orElse(null);
            }

            if (student != null) {
                AttendanceRecord record = AttendanceRecord.builder()
                        .student(student)
                        .date(recordDate)
                        .status(item.status != null ? item.status.toUpperCase() : "PRESENT")
                        .courseName(request.courseName != null ? request.courseName : "Cloud Computing")
                        .remarks(item.remarks != null ? item.remarks : "-")
                        .build();
                savedRecords.add(attendanceRepository.save(record));
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Berhasil mencatat attendance secara bulk");
        response.put("total_processed", savedRecords.size());
        response.put("records", savedRecords);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttendanceRecord(@PathVariable Long id) {
        if (!attendanceRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Catatan presensi tidak ditemukan");
        }
        attendanceRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Catatan presensi berhasil dihapus", "id", id));
    }

    @GetMapping("/student/{id}")
    public ResponseEntity<?> getStudentAttendanceHistory(@PathVariable String id) {
        List<AttendanceRecord> records;
        try {
            Long studentId = Long.parseLong(id);
            records = attendanceRepository.findByStudentId(studentId);
        } catch (NumberFormatException e) {
            // Assume NIM / rollNumber
            records = attendanceRepository.findByStudentRollNumber(id);
        }

        return ResponseEntity.ok(records);
    }

    @GetMapping("/student/{id}/percentage")
    public ResponseEntity<?> getStudentAttendancePercentage(@PathVariable String id) {
        List<AttendanceRecord> records;
        Student student = null;
        try {
            Long studentId = Long.parseLong(id);
            records = attendanceRepository.findByStudentId(studentId);
            student = studentRepository.findById(studentId).orElse(null);
        } catch (NumberFormatException e) {
            records = attendanceRepository.findByStudentRollNumber(id);
            student = studentRepository.findByRollNumber(id).orElse(null);
        }

        int total = records.size();
        long presentCount = records.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus())).count();
        long lateCount = records.stream().filter(r -> "LATE".equalsIgnoreCase(r.getStatus())).count();
        long absentCount = records.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getStatus())).count();

        // Standard calculation: PRESENT + 0.5 * LATE
        double score = presentCount + (lateCount * 0.5);
        double percentage = total > 0 ? Math.round((score / total) * 10000.0) / 100.0 : 100.0;

        Map<String, Object> response = new HashMap<>();
        response.put("student_id", student != null ? student.getId() : id);
        response.put("roll_number", student != null ? student.getRollNumber() : id);
        response.put("student_name", student != null ? student.getName() : "Unknown");
        response.put("total_sessions", total);
        response.put("present_count", presentCount);
        response.put("late_count", lateCount);
        response.put("absent_count", absentCount);
        response.put("attendance_percentage", percentage);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/report/monthly")
    public ResponseEntity<?> getMonthlyReport() {
        List<AttendanceRecord> allRecords = attendanceRepository.findAll();
        int totalRecords = allRecords.size();
        long totalPresent = allRecords.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus())).count();
        long totalLate = allRecords.stream().filter(r -> "LATE".equalsIgnoreCase(r.getStatus())).count();
        long totalAbsent = allRecords.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getStatus())).count();

        double overallPercentage = totalRecords > 0 ? Math.round(((totalPresent + totalLate * 0.5) / totalRecords) * 10000.0) / 100.0 : 100.0;

        Map<String, Object> report = new HashMap<>();
        report.put("period", "Bulan Ini");
        report.put("total_records", totalRecords);
        report.put("total_present", totalPresent);
        report.put("total_late", totalLate);
        report.put("total_absent", totalAbsent);
        report.put("overall_attendance_percentage", overallPercentage);

        return ResponseEntity.ok(report);
    }

    @GetMapping("/report/low-attendance")
    public ResponseEntity<?> getLowAttendanceReport(@RequestParam(defaultValue = "75.0") double threshold) {
        List<Student> students = studentRepository.findAll();
        List<Map<String, Object>> lowAttendanceList = new ArrayList<>();

        for (Student st : students) {
            List<AttendanceRecord> records = attendanceRepository.findByStudentId(st.getId());
            int total = records.size();
            if (total == 0) continue;

            long presentCount = records.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus())).count();
            long lateCount = records.stream().filter(r -> "LATE".equalsIgnoreCase(r.getStatus())).count();
            double pct = Math.round(((presentCount + lateCount * 0.5) / total) * 10000.0) / 100.0;

            if (pct < threshold) {
                Map<String, Object> item = new HashMap<>();
                item.put("student_id", st.getId());
                item.put("roll_number", st.getRollNumber());
                item.put("name", st.getName());
                item.put("department", st.getDepartment());
                item.put("total_sessions", total);
                item.put("percentage", pct);
                lowAttendanceList.add(item);
            }
        }

        return ResponseEntity.ok(lowAttendanceList);
    }
}
