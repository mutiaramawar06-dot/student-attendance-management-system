package com.attendance.entity;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "attendance_students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("rollNumber")
    @JsonAlias({"roll_number", "rollNumber"})
    @Column(name = "roll_number", unique = true, nullable = false)
    private String rollNumber; // NIM Business Key

    @Column(nullable = false)
    private String name;

    private String email;
    private String department;
}

