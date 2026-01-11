package com.yourcompany.onlineexam.controller;

import com.yourcompany.onlineexam.model.Message;
import com.yourcompany.onlineexam.model.Conversation;
import com.yourcompany.onlineexam.service.MessageService;
import com.yourcompany.onlineexam.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    /**
     * Gửi tin nhắn
     */
    @PostMapping("/send")
    public ResponseEntity<String> sendMessage(@RequestBody Map<String, String> request) {
        try {
            String senderId = request.get("senderId");
            String receiverId = request.get("receiverId");
            String content = request.get("content");
            
            if (senderId == null || receiverId == null || content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Thiếu thông tin gửi tin nhắn");
            }
            
            messageService.sendMessage(senderId, receiverId, content.trim());
            return ResponseEntity.ok("Đã gửi tin nhắn thành công");
        } catch (Exception e) {
            System.err.println("Lỗi khi gửi tin nhắn: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi khi gửi tin nhắn");
        }
    }

    /**
     * Lấy tin nhắn của conversation
     */
    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<List<Message>> getMessages(@PathVariable String conversationId) {
        try {
            List<Message> messages = messageService.getMessages(conversationId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy tin nhắn: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy danh sách conversations của user
     */
    @GetMapping("/conversations/{userId}")
    public ResponseEntity<List<Conversation>> getUserConversations(@PathVariable String userId) {
        try {
            List<Conversation> conversations = messageService.getUserConversations(userId);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy conversations: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    @PutMapping("/conversation/{conversationId}/read/{userId}")
    public ResponseEntity<String> markMessagesAsRead(
            @PathVariable String conversationId,
            @PathVariable String userId) {
        try {
            messageService.markMessagesAsRead(conversationId, userId);
            return ResponseEntity.ok("Đã đánh dấu tin nhắn đã đọc");
        } catch (Exception e) {
            System.err.println("Lỗi khi đánh dấu tin nhắn đã đọc: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Lỗi khi đánh dấu tin nhắn đã đọc");
        }
    }

    /**
     * Lấy unread count của user
     */
    @GetMapping("/unread-count/{userId}")
    public ResponseEntity<Map<String, Integer>> getUnreadCount(@PathVariable String userId) {
        try {
            int unreadCount = messageService.getUnreadCount(userId);
            Map<String, Integer> response = new HashMap<>();
            response.put("unreadCount", unreadCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy unread count: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Tìm user theo email để gửi tin nhắn
     */
    @GetMapping("/find-user/{email}")
    public ResponseEntity<Map<String, Object>> findUserByEmail(@PathVariable String email) {
        try {
            String normalizedEmail = email.toLowerCase().trim();
            String userId = userService.findUserIdByEmail(normalizedEmail);
            
            Map<String, Object> response = new HashMap<>();
            if (userId != null) {
                response.put("found", true);
                response.put("userId", userId);
                response.put("email", normalizedEmail);
            } else {
                response.put("found", false);
                response.put("message", "Không tìm thấy người dùng với email này");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Lỗi khi tìm user: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Lấy thông tin user cho conversation
     */
    @GetMapping("/user-info/{userId}")
    public ResponseEntity<Map<String, Object>> getUserInfo(@PathVariable String userId) {
        try {
            Map<String, Object> userInfo = userService.getUserInfo(userId);
            return ResponseEntity.ok(userInfo);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy thông tin user: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
} 