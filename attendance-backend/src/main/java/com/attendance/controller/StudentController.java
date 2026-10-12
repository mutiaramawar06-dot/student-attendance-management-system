package com.attendance.controller;

import com.attendance.entity.AttendanceRecord;
import com.attendance.entity.Student;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;

    public StudentController(StudentRepository studentRepository, AttendanceRepository attendanceRepository) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStudentById(@PathVariable Long id) {
        Optional<Student> student = studentRepository.findById(id);
        if (student.isPresent()) {
            return ResponseEntity.ok(student.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student dengan ID " + id + " tidak ditemukan");
    }

    @GetMapping("/roll/{rollNumber}")
    public ResponseEntity<?> getStudentByRollNumber(@PathVariable String rollNumber) {
        Optional<Student> student = studentRepository.findByRollNumber(rollNumber);
        if (student.isPresent()) {
            return ResponseEntity.ok(student.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student dengan NIM " + rollNumber + " tidak ditemukan");
    }

    @PostMapping
    public ResponseEntity<?> createOrSyncStudent(@RequestBody Student student) {
        if (student.getRollNumber() == null || student.getRollNumber().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Roll Number / NIM wajib diisi");
        }

        Optional<Student> existing = studentRepository.findByRollNumber(student.getRollNumber());
        if (existing.isPresent()) {
            // Update info
            Student ex = existing.get();
            ex.setName(student.getName());
            if (student.getEmail() != null) ex.setEmail(student.getEmail());
            if (student.getDepartment() != null) ex.setDepartment(student.getDepartment());
            Student updated = studentRepository.save(ex);
            return ResponseEntity.ok(updated);
        }

        Student saved = studentRepository.save(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{rollNumber}")
    public ResponseEntity<?> deleteStudent(@PathVariable String rollNumber) {
        Optional<Student> studentOpt = studentRepository.findByRollNumber(rollNumber);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "Mahasiswa tidak ditemukan"));
        }
        Student student = studentOpt.get();
        List<AttendanceRecord> records = attendanceRepository.findByStudentId(student.getId());
        attendanceRepository.deleteAll(records);
        studentRepository.delete(student);
        return ResponseEntity.ok(Map.of("message", "Mahasiswa " + rollNumber + " berhasil dihapus"));
    }
}
