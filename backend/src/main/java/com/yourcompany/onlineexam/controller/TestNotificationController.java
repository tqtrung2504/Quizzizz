package com.yourcompany.onlineexam.controller;

import com.yourcompany.onlineexam.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestNotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * Test push notification
     */
    @PostMapping("/notification")
    public ResponseEntity<Map<String, Object>> testNotification(@RequestBody Map<String, Object> request) {
        try {
            String userId = (String) request.get("userId");
            String title = (String) request.get("title");
            String message = (String) request.get("message");
            String type = (String) request.get("type");

            if (userId == null || title == null || message == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Thiếu thông tin: userId, title, message"
                ));
            }

            // Push notification
            notificationService.pushNotificationToUser(userId, title, message, type != null ? type : "test");

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã push notification thành công",
                "data", Map.of(
                    "userId", userId,
                    "title", title,
                    "message", message,
                    "type", type != null ? type : "test"
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    /**
     * Test push notification cho nhiều users
     */
    @PostMapping("/notification-multiple")
    public ResponseEntity<Map<String, Object>> testNotificationMultiple(@RequestBody Map<String, Object> request) {
        try {
            String title = (String) request.get("title");
            String message = (String) request.get("message");
            String type = (String) request.get("type");
            @SuppressWarnings("unchecked")
            java.util.List<String> userIds = (java.util.List<String>) request.get("userIds");

            if (userIds == null || userIds.isEmpty() || title == null || message == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Thiếu thông tin: userIds, title, message"
                ));
            }

            // Push notification cho nhiều users
            notificationService.pushNotificationToUsers(userIds, title, message, type != null ? type : "test");

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã push notification cho " + userIds.size() + " users",
                "data", Map.of(
                    "userIds", userIds,
                    "title", title,
                    "message", message,
                    "type", type != null ? type : "test"
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }

    /**
     * Test notification cho bài thi mới
     */
    @PostMapping("/exam-notification")
    public ResponseEntity<Map<String, Object>> testExamNotification(@RequestBody Map<String, Object> request) {
        try {
            String examName = (String) request.get("examName");
            String courseName = (String) request.get("courseName");
            @SuppressWarnings("unchecked")
            java.util.List<String> studentIds = (java.util.List<String>) request.get("studentIds");

            if (examName == null || courseName == null || studentIds == null || studentIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Thiếu thông tin: examName, courseName, studentIds"
                ));
            }

            String title = "Bài thi mới";
            String message = String.format("Bạn có bài thi mới: \"%s\" trong lớp \"%s\"", examName, courseName);

            // Push notification cho tất cả students
            notificationService.pushNotificationToUsers(studentIds, title, message, "exam_created", "test-exam-id");

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã push notification bài thi mới cho " + studentIds.size() + " students",
                "data", Map.of(
                    "examName", examName,
                    "courseName", courseName,
                    "studentIds", studentIds,
                    "title", title,
                    "message", message
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Lỗi: " + e.getMessage()
            ));
        }
    }
} 