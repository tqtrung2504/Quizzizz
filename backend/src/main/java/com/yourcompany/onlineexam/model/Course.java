package com.yourcompany.onlineexam.model;

import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
public class Course {
    private String id;  // Firestore dùng String ID
    private String code;
    private String name;
    private String description;
    private Integer credits;
    private String department;
    private Date createdAt;
    private Date updatedAt;
    private List<String> students; // Danh sách userId hoặc email sinh viên

    public void setId(String id) {
        this.id = id;
    }

    public List<String> getStudents() {
        return students;
    }

    public void setStudents(List<String> students) {
        this.students = students;
    }
}