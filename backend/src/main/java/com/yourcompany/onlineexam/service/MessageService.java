package com.yourcompany.onlineexam.service;

import com.google.firebase.database.*;
import com.yourcompany.onlineexam.model.Message;
import com.yourcompany.onlineexam.model.Conversation;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.Map;

@Service
public class MessageService {

    private final FirebaseDatabase database = FirebaseDatabase.getInstance();

    /**
     * Tạo hoặc lấy conversation giữa 2 user
     */
    public String getOrCreateConversation(String userId1, String userId2) {
        // Sắp xếp userId để đảm bảo conversationId nhất quán
        List<String> sortedUsers = Arrays.asList(userId1, userId2);
        Collections.sort(sortedUsers);
        String conversationId = sortedUsers.get(0) + "_" + sortedUsers.get(1);

        DatabaseReference conversationRef = database.getReference("conversations").child(conversationId);
        
        // Kiểm tra conversation đã tồn tại chưa bằng listener
        conversationRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshot) {
                if (!snapshot.exists()) {
                    // Tạo conversation mới
                    Conversation conversation = new Conversation();
                    conversation.setId(conversationId);
                    conversation.setParticipants(sortedUsers);
                    conversation.setLastMessage("");
                    conversation.setLastMessageTime(new Date());
                    conversation.setCreatedAt(new Date());
                    
                    conversationRef.setValue(conversation, (error, ref) -> {
                        if (error != null) {
                            System.err.println("Lỗi khi tạo conversation: " + error.getMessage());
                        }
                    });
                }
            }
            
            @Override
            public void onCancelled(DatabaseError databaseError) {
                System.err.println("Lỗi khi kiểm tra conversation: " + databaseError.getMessage());
            }
        });
        
        return conversationId;
    }

    /**
     * Gửi tin nhắn
     */
    public void sendMessage(String senderId, String receiverId, String content) {
        try {
            String conversationId = getOrCreateConversation(senderId, receiverId);
            String messageId = database.getReference("messages").child(conversationId).push().getKey();
            
            // Tạo message data với timestamp dạng số (milliseconds)
            Map<String, Object> messageData = new HashMap<>();
            messageData.put("id", messageId);
            messageData.put("conversationId", conversationId);
            messageData.put("senderId", senderId);
            messageData.put("receiverId", receiverId);
            messageData.put("content", content);
            messageData.put("timestamp", System.currentTimeMillis()); // Lưu timestamp dạng số
            messageData.put("isRead", false);
            
            // Lưu tin nhắn
            database.getReference("messages").child(conversationId).child(messageId).setValue(messageData, (error, ref) -> {
                if (error != null) {
                    System.err.println("Lỗi khi lưu tin nhắn: " + error.getMessage());
                } else {
                    System.out.println("Đã lưu tin nhắn thành công: " + messageId + " vào conversation: " + conversationId);
                }
            });
            
            // Cập nhật conversation
            DatabaseReference conversationRef = database.getReference("conversations").child(conversationId);
            Map<String, Object> updates = new HashMap<>();
            updates.put("lastMessage", content);
            updates.put("lastMessageTime", new Date().getTime());
            updates.put("lastSenderId", senderId);
            conversationRef.updateChildren(updates, (error, ref) -> {
                if (error != null) {
                    System.err.println("Lỗi khi cập nhật conversation: " + error.getMessage());
                }
            });
            
            // Cập nhật unread count cho receiver
            updateUnreadCount(conversationId, receiverId, 1);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi gửi tin nhắn: " + e.getMessage());
        }
    }

    /**
     * Lấy tin nhắn của conversation
     */
    public List<Message> getMessages(String conversationId) {
        CompletableFuture<List<Message>> future = new CompletableFuture<>();
        
        DatabaseReference messagesRef = database.getReference("messages").child(conversationId);
        messagesRef.orderByChild("timestamp").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                List<Message> messages = new ArrayList<>();
                for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                    try {
                        Message message = snapshot.getValue(Message.class);
                        if (message != null) {
                            message.setId(snapshot.getKey());
                            messages.add(message);
                        }
                    } catch (Exception e) {
                        System.err.println("Lỗi khi parse message: " + e.getMessage());
                    }
                }
                future.complete(messages);
            }
            
            @Override
            public void onCancelled(DatabaseError databaseError) {
                System.err.println("Lỗi khi lấy tin nhắn: " + databaseError.getMessage());
                future.complete(new ArrayList<>());
            }
        });
        
        try {
            return future.get(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("Timeout khi lấy tin nhắn: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Lấy danh sách conversations của user
     */
    public List<Conversation> getUserConversations(String userId) {
        CompletableFuture<List<Conversation>> future = new CompletableFuture<>();
        
        DatabaseReference conversationsRef = database.getReference("conversations");
        conversationsRef.orderByChild("participants").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                List<Conversation> conversations = new ArrayList<>();
                for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                    try {
                        Conversation conversation = snapshot.getValue(Conversation.class);
                        if (conversation != null && conversation.getParticipants().contains(userId)) {
                            conversation.setId(snapshot.getKey());
                            conversations.add(conversation);
                        }
                    } catch (Exception e) {
                        System.err.println("Lỗi khi parse conversation: " + e.getMessage());
                    }
                }
                // Sắp xếp theo thời gian tin nhắn cuối
                conversations.sort((c1, c2) -> {
                    if (c1.getLastMessageTime() == null) return 1;
                    if (c2.getLastMessageTime() == null) return -1;
                    return c2.getLastMessageTime().compareTo(c1.getLastMessageTime());
                });
                future.complete(conversations);
            }
            
            @Override
            public void onCancelled(DatabaseError databaseError) {
                System.err.println("Lỗi khi lấy conversations: " + databaseError.getMessage());
                future.complete(new ArrayList<>());
            }
        });
        
        try {
            return future.get(5, TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("Timeout khi lấy conversations: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    public void markMessagesAsRead(String conversationId, String userId) {
        try {
            DatabaseReference messagesRef = database.getReference("messages").child(conversationId);
            messagesRef.orderByChild("senderId").equalTo(userId).addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                        Message message = snapshot.getValue(Message.class);
                        if (message != null && !message.isRead()) {
                            snapshot.getRef().child("isRead").setValue(true, (error, ref) -> {
                                if (error != null) {
                                    System.err.println("Lỗi khi đánh dấu tin nhắn đã đọc: " + error.getMessage());
                                }
                            });
                        }
                    }
                    // Reset unread count
                    updateUnreadCount(conversationId, userId, 0);
                }
                
                @Override
                public void onCancelled(DatabaseError databaseError) {
                    System.err.println("Lỗi khi đánh dấu tin nhắn đã đọc: " + databaseError.getMessage());
                }
            });
        } catch (Exception e) {
            System.err.println("Lỗi khi đánh dấu tin nhắn đã đọc: " + e.getMessage());
        }
    }

    /**
     * Cập nhật unread count
     */
    private void updateUnreadCount(String conversationId, String userId, int increment) {
        try {
            DatabaseReference unreadRef = database.getReference("unread_counts").child(conversationId).child(userId);
            unreadRef.addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    int currentCount = dataSnapshot.exists() ? dataSnapshot.getValue(Integer.class) : 0;
                    int newCount = Math.max(0, currentCount + increment);
                    unreadRef.setValue(newCount, (error, ref) -> {
                        if (error != null) {
                            System.err.println("Lỗi khi cập nhật unread count: " + error.getMessage());
                        }
                    });
                }
                
                @Override
                public void onCancelled(DatabaseError databaseError) {
                    System.err.println("Lỗi khi cập nhật unread count: " + databaseError.getMessage());
                }
            });
        } catch (Exception e) {
            System.err.println("Lỗi khi cập nhật unread count: " + e.getMessage());
        }
    }

    /**
     * Lấy unread count của user
     */
    public int getUnreadCount(String userId) {
        CompletableFuture<Integer> future = new CompletableFuture<>();
        
        DatabaseReference unreadRef = database.getReference("unread_counts");
        unreadRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                int totalUnread = 0;
                for (DataSnapshot conversationSnapshot : dataSnapshot.getChildren()) {
                    DataSnapshot userSnapshot = conversationSnapshot.child(userId);
                    if (userSnapshot.exists()) {
                        totalUnread += userSnapshot.getValue(Integer.class);
                    }
                }
                future.complete(totalUnread);
            }
            
            @Override
            public void onCancelled(DatabaseError databaseError) {
                System.err.println("Lỗi khi lấy unread count: " + databaseError.getMessage());
                future.complete(0);
            }
        });
        
        try {
            return future.get(3, TimeUnit.SECONDS);
        } catch (Exception e) {
            System.err.println("Timeout khi lấy unread count: " + e.getMessage());
            return 0;
        }
    }
} 