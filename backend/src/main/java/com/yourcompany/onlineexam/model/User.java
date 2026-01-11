package com.yourcompany.onlineexam.model;

import com.google.cloud.firestore.annotation.DocumentId;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.Date;

@Getter
@Setter // Tự động tạo getters, setters
@NoArgsConstructor // Tự động tạo constructor không đối số
@AllArgsConstructor // Tự động tạo constructor với tất cả các đối số
public class User {
    @DocumentId // Đánh dấu trường này là ID của document trong Firestore
    private String uid; // UID từ Firebase Authentication
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private String imageUrl;
    private String role; // "user", "admin"
    private String intakeId;
    private Date createdAt;
    private Date lastLoginAt;
    private Boolean isDeleted;

    // Thông tin bổ sung cho profile
    private String phone;
    private String address;
    private String bio;
    private String studentId;
    private String major;
    private String year;
}