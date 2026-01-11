package com.yourcompany.onlineexam.controller;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.yourcompany.onlineexam.model.Notification;
import com.yourcompany.onlineexam.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * Lấy tất cả notifications của một user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable String userId) {
        try {
            List<Notification> notifications = getNotificationsFromRealtimeDB(userId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy notifications: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Đánh dấu notification đã đọc
     */
    @PutMapping("/user/{userId}/notification/{notificationId}/read")
    public ResponseEntity<String> markNotificationAsRead(
            @PathVariable String userId,
            @PathVariable String notificationId) {
        try {
            notificationService.markNotificationAsRead(userId, notificationId);
            return ResponseEntity.ok("Đã đánh dấu notification đã đọc");
        } catch (Exception e) {
            System.err.println("Lỗi khi đánh dấu notification đã đọc: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Xóa notification
     */
    @DeleteMapping("/user/{userId}/notification/{notificationId}")
    public ResponseEntity<String> deleteNotification(
            @PathVariable String userId,
            @PathVariable String notificationId) {
        try {
            notificationService.deleteNotification(userId, notificationId);
            return ResponseEntity.ok("Đã xóa notification");
        } catch (Exception e) {
            System.err.println("Lỗi khi xóa notification: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Đánh dấu tất cả notifications của user đã đọc
     */
    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<String> markAllNotificationsAsRead(@PathVariable String userId) {
        try {
            List<Notification> notifications = getNotificationsFromRealtimeDB(userId);
            for (Notification notification : notifications) {
                if (!notification.isRead()) {
                    notificationService.markNotificationAsRead(userId, notification.getId());
                }
            }
            return ResponseEntity.ok("Đã đánh dấu tất cả notifications đã đọc");
        } catch (Exception e) {
            System.err.println("Lỗi khi đánh dấu tất cả notifications đã đọc: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy số lượng notifications chưa đọc của user
     */
    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount(@PathVariable String userId) {
        try {
            List<Notification> notifications = getNotificationsFromRealtimeDB(userId);
            int unreadCount = (int) notifications.stream()
                .filter(notification -> !notification.isRead())
                .count();
            
            Map<String, Integer> response = new HashMap<>();
            response.put("unreadCount", unreadCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy số lượng notifications chưa đọc: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy notifications từ Realtime Database (fix: robust error handling, timeout)
     */
    private List<Notification> getNotificationsFromRealtimeDB(String userId) {
        CompletableFuture<List<Notification>> future = new CompletableFuture<>();
        DatabaseReference userNotificationsRef = FirebaseDatabase.getInstance()
            .getReference()
            .child("notifications")
            .child(userId);
        userNotificationsRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                List<Notification> notifications = new ArrayList<>();
                for (DataSnapshot notificationSnapshot : dataSnapshot.getChildren()) {
                    try {
                        Object value = notificationSnapshot.getValue();
                        if (value instanceof Map) {
                            Map<String, Object> notificationData = (Map<String, Object>) value;
                            Notification notification = new Notification();
                            notification.setId((String) notificationData.getOrDefault("id", ""));
                            notification.setUserId((String) notificationData.getOrDefault("userId", ""));
                            notification.setTitle((String) notificationData.getOrDefault("title", ""));
                            notification.setMessage((String) notificationData.getOrDefault("message", ""));
                            notification.setType((String) notificationData.getOrDefault("type", ""));
                            notification.setRelatedId((String) notificationData.getOrDefault("relatedId", ""));
                            // isRead
                            Object isReadObj = notificationData.get("isRead");
                            boolean isRead = false;
                            if (isReadObj instanceof Boolean) isRead = (Boolean) isReadObj;
                            else if (isReadObj instanceof String) isRead = Boolean.parseBoolean((String) isReadObj);
                            notification.setRead(isRead);
                            // createdAt
                            Object createdAtObj = notificationData.get("createdAt");
                            if (createdAtObj instanceof Long) notification.setCreatedAt(new java.util.Date((Long) createdAtObj));
                            else if (createdAtObj instanceof Integer) notification.setCreatedAt(new java.util.Date(((Integer) createdAtObj).longValue()));
                            // readAt
                            Object readAtObj = notificationData.get("readAt");
                            if (readAtObj instanceof Long) notification.setReadAt(new java.util.Date((Long) readAtObj));
                            else if (readAtObj instanceof Integer) notification.setReadAt(new java.util.Date(((Integer) readAtObj).longValue()));
                            notifications.add(notification);
                        }
                    } catch (Exception e) {
                        System.err.println("[NotificationController] Lỗi khi parse notification: " + e.getMessage());
                        // Bỏ qua notification lỗi, không throw
                    }
                }
                // Sắp xếp theo thời gian tạo (mới nhất trước)
                notifications.sort((n1, n2) -> {
                    if (n1.getCreatedAt() == null) return 1;
                    if (n2.getCreatedAt() == null) return -1;
                    return n2.getCreatedAt().compareTo(n1.getCreatedAt());
                });
                future.complete(notifications);
            }
            @Override
            public void onCancelled(DatabaseError databaseError) {
                System.err.println("[NotificationController] Lỗi khi đọc notifications: " + databaseError.getMessage());
                future.complete(new ArrayList<>());
            }
        });
        try {
            // Giới hạn thời gian chờ 3 giây
            return future.get(3, TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("[NotificationController] Lỗi khi lấy notifications (timeout hoặc lỗi khác): " + e.getMessage());
            return new ArrayList<>();
        }
    }
} 