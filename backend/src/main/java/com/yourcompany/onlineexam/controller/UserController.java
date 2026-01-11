package com.yourcompany.onlineexam.controller;

import com.yourcompany.onlineexam.model.User;
import com.yourcompany.onlineexam.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://doanliennganh.vercel.app"})
public class UserController {
    private final UserService userService;
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAll() {
        try {
            return ResponseEntity.ok(userService.getAll());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách user: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<User> create(@RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.create(user));
        } catch (Exception e) {
            logger.error("Lỗi khi tạo user: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{uid}")
    public ResponseEntity<User> update(@PathVariable String uid, @RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.update(uid, user));
        } catch (Exception e) {
            logger.error("Lỗi khi cập nhật user {}: ", uid, e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{uid}")
    public ResponseEntity<Void> delete(@PathVariable String uid) {
        try {
            userService.delete(uid);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Lỗi khi xóa user {}: ", uid, e);
            return ResponseEntity.status(500).build();
        }
    }

    @PatchMapping("/{uid}/role")
    public ResponseEntity<User> changeRole(@PathVariable String uid, @RequestBody Map<String, String> body) {
        try {
            String role = body.get("role");
            return ResponseEntity.ok(userService.changeRole(uid, role));
        } catch (Exception e) {
            logger.error("Lỗi khi đổi role user {}: ", uid, e);
            return ResponseEntity.status(500).build();
        }
    }

    @PatchMapping("/{uid}/disable")
    public ResponseEntity<User> disableUser(@PathVariable String uid, @RequestBody Map<String, Boolean> body) {
        try {
            boolean isDeleted = body.getOrDefault("isDeleted", false);
            return ResponseEntity.ok(userService.disableUser(uid, isDeleted));
        } catch (Exception e) {
            logger.error("Lỗi khi vô hiệu hóa user {}: ", uid, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Lấy danh sách tất cả users (cho chức năng hộp thư)
     */
    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        try {
            List<User> users = userService.getAll();
            List<Map<String, Object>> userList = new ArrayList<>();
            
            for (User user : users) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("uid", user.getUid());
                userInfo.put("email", user.getEmail());
                userInfo.put("username", user.getUsername());
                userInfo.put("displayName", user.getFirstName() + " " + user.getLastName());
                userInfo.put("photoURL", user.getImageUrl());
                userInfo.put("role", user.getRole());
                userInfo.put("phone", user.getPhone());
                userInfo.put("address", user.getAddress());
                userInfo.put("bio", user.getBio());
                userInfo.put("studentId", user.getStudentId());
                userInfo.put("major", user.getMajor());
                userInfo.put("year", user.getYear());
                userList.add(userInfo);
            }
            
            return ResponseEntity.ok(userList);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách users: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{uid:^(?!all$).+}")
    public ResponseEntity<User> getById(@PathVariable String uid) {
        try {
            List<User> users = userService.getAll();
            for (User user : users) {
                if (user.getUid() != null && user.getUid().equals(uid)) {
                    return ResponseEntity.ok(user);
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Lỗi khi lấy user {}: ", uid, e);
            return ResponseEntity.status(500).build();
        }
    }
} 