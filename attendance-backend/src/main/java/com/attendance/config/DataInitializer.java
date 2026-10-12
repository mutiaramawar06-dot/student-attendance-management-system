package com.attendance.config;

import com.attendance.entity.AttendanceRecord;
import com.attendance.entity.Student;
import com.attendance.repository.AttendanceRepository;
import com.attendance.repository.StudentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;

    public DataInitializer(StudentRepository studentRepository, AttendanceRepository attendanceRepository) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (studentRepository.count() == 0) {
            Student s1 = studentRepository.save(Student.builder().rollNumber("220101").name("Budi Santoso").email("budi@student.univ.ac.id").department("Teknik Informatika").build());
            Student s2 = studentRepository.save(Student.builder().rollNumber("220102").name("Siti Rahma").email("siti@student.univ.ac.id").department("Sistem Informasi").build());
            Student s3 = studentRepository.save(Student.builder().rollNumber("220103").name("Andi Wijaya").email("andi@student.univ.ac.id").department("Teknik Komputer").build());
            Student s4 = studentRepository.save(Student.builder().rollNumber("220104").name("Dewi Lestari").email("dewi@student.univ.ac.id").department("Teknik Informatika").build());
            Student s5 = studentRepository.save(Student.builder().rollNumber("220105").name("Eko Prasetyo").email("eko@student.univ.ac.id").department("Sistem Informasi").build());

            LocalDate now = LocalDate.now();

            // Seed Attendance records
            attendanceRepository.saveAll(List.of(
                AttendanceRecord.builder().student(s1).date(now.minusDays(4)).status("PRESENT").courseName("Cloud Computing").remarks("Hadir").build(),
                AttendanceRecord.builder().student(s1).date(now.minusDays(3)).status("PRESENT").courseName("Cloud Computing").remarks("Hadir").build(),
                AttendanceRecord.builder().student(s1).date(now.minusDays(2)).status("PRESENT").courseName("Cloud Computing").remarks("Hadir").build(),
                AttendanceRecord.builder().student(s1).date(now.minusDays(1)).status("PRESENT").courseName("Cloud Computing").remarks("Hadir").build(),
                AttendanceRecord.builder().student(s1).date(now).status("PRESENT").courseName("Cloud Computing").remarks("Hadir").build(),

                AttendanceRecord.builder().student(s2).date(now.minusDays(2)).status("PRESENT").courseName("Cloud Computing").remarks("Hadir").build(),
                AttendanceRecord.builder().student(s2).date(now.minusDays(1)).status("LATE").courseName("Cloud Computing").remarks("Terlambat 10 menit").build(),
                AttendanceRecord.builder().student(s2).date(now).status("PRESENT").courseName("Cloud Computing").remarks("Hadir").build(),

                AttendanceRecord.builder().student(s3).date(now.minusDays(2)).status("ABSENT").courseName("Cloud Computing").remarks("Sakit").build(),
                AttendanceRecord.builder().student(s3).date(now.minusDays(1)).status("ABSENT").courseName("Cloud Computing").remarks("Tanpa Keterangan").build(),
                AttendanceRecord.builder().student(s3).date(now).status("PRESENT").courseName("Cloud Computing").remarks("Hadir").build(),

                AttendanceRecord.builder().student(s4).date(now.minusDays(1)).status("PRESENT").courseName("Cloud Computing").remarks("Hadir").build(),
                AttendanceRecord.builder().student(s4).date(now).status("PRESENT").courseName("Cloud Computing").remarks("Hadir").build(),

                AttendanceRecord.builder().student(s5).date(now.minusDays(3)).status("ABSENT").courseName("Cloud Computing").remarks("Tanpa Keterangan").build(),
                AttendanceRecord.builder().student(s5).date(now.minusDays(2)).status("ABSENT").courseName("Cloud Computing").remarks("Tanpa Keterangan").build(),
                AttendanceRecord.builder().student(s5).date(now.minusDays(1)).status("ABSENT").courseName("Cloud Computing").remarks("Tanpa Keterangan").build(),
                AttendanceRecord.builder().student(s5).date(now).status("LATE").courseName("Cloud Computing").remarks("Terlambat 20 menit").build()
            ));
        }
    }
}
