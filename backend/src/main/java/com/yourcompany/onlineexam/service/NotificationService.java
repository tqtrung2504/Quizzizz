package com.yourcompany.onlineexam.service;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.yourcompany.onlineexam.model.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {
    
    private final DatabaseReference databaseReference;
    
    @Autowired
    public NotificationService(FirebaseDatabase firebaseDatabase) {
        this.databaseReference = firebaseDatabase.getReference();
    }
    
    /**
     * Push notification cho một user cụ thể
     */
    public void pushNotificationToUser(String userId, String title, String message, String type) {
        pushNotificationToUser(userId, title, message, type, null);
    }
    
    /**
     * Push notification cho một user cụ thể với relatedId
     */
    public void pushNotificationToUser(String userId, String title, String message, String type, String relatedId) {
        try {
            System.out.println("[NOTIFICATION_SERVICE] Bắt đầu push notification cho user: " + userId);
            
            String notificationId = UUID.randomUUID().toString();
            DatabaseReference userNotificationsRef = databaseReference
                .child("notifications")
                .child(userId)
                .child(notificationId);
            
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("id", notificationId);
            notificationData.put("userId", userId);
            notificationData.put("title", title);
            notificationData.put("message", message);
            notificationData.put("type", type);
            notificationData.put("relatedId", relatedId);
            notificationData.put("isRead", false);
            notificationData.put("createdAt", new Date().getTime());
            
            System.out.println("[NOTIFICATION_SERVICE] Notification data: " + notificationData.toString());
            System.out.println("[NOTIFICATION_SERVICE] Database path: notifications/" + userId + "/" + notificationId);
            
            userNotificationsRef.setValueAsync(notificationData);
            System.out.println("Đã push notification cho user " + userId + ": " + title);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi push notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Push notification cho nhiều users cùng lúc
     */
    public void pushNotificationToUsers(java.util.List<String> userIds, String title, String message, String type) {
        pushNotificationToUsers(userIds, title, message, type, null);
    }
    
    /**
     * Push notification cho nhiều users cùng lúc với relatedId
     */
    public void pushNotificationToUsers(java.util.List<String> userIds, String title, String message, String type, String relatedId) {
        System.out.println("[NOTIFICATION_SERVICE] Bắt đầu push notification cho " + userIds.size() + " users");
        System.out.println("[NOTIFICATION_SERVICE] Title: " + title);
        System.out.println("[NOTIFICATION_SERVICE] Message: " + message);
        System.out.println("[NOTIFICATION_SERVICE] Type: " + type);
        System.out.println("[NOTIFICATION_SERVICE] Related ID: " + relatedId);
        
        for (String userId : userIds) {
            System.out.println("[NOTIFICATION_SERVICE] Push notification cho user: " + userId);
            pushNotificationToUser(userId, title, message, type, relatedId);
        }
        
        System.out.println("[NOTIFICATION_SERVICE] Hoàn thành push notification cho tất cả users");
    }
    
    /**
     * Đánh dấu notification đã đọc
     */
    public void markNotificationAsRead(String userId, String notificationId) {
        try {
            DatabaseReference notificationRef = databaseReference
                .child("notifications")
                .child(userId)
                .child(notificationId);
            
            Map<String, Object> updates = new HashMap<>();
            updates.put("isRead", true);
            updates.put("readAt", new Date().getTime());
            
            notificationRef.updateChildrenAsync(updates);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi đánh dấu notification đã đọc: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Xóa notification
     */
    public void deleteNotification(String userId, String notificationId) {
        try {
            DatabaseReference notificationRef = databaseReference
                .child("notifications")
                .child(userId)
                .child(notificationId);
            
            notificationRef.removeValueAsync();
            
        } catch (Exception e) {
            System.err.println("Lỗi khi xóa notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 