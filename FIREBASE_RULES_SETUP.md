# Hướng dẫn cập nhật Firebase Rules cho chức năng Messaging

## Tổng quan
Để chức năng messaging hoạt động đúng, bạn cần cập nhật Firebase Rules cho cả Realtime Database và Firestore (nếu sử dụng).

## 1. Firebase Realtime Database Rules

### Cách cập nhật:
1. Đăng nhập vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Realtime Database** > **Rules**
4. Copy nội dung từ file `firebase_realtime_rules.json`
5. Paste vào editor và click **Publish**

### Rules mới được thêm:

#### Messages
```json
"messages": {
  "$conversationId": {
    ".read": "auth != null && (data.child('participants').child(auth.uid).exists() || root.child('users').child(auth.uid).child('role').val() == 'admin')",
    ".write": "auth != null && (data.child('participants').child(auth.uid).exists() || root.child('users').child(auth.uid).child('role').val() == 'admin')",
    "$messageId": {
      ".read": "auth != null && (root.child('messages').child($conversationId).child('participants').child(auth.uid).exists() || root.child('users').child(auth.uid).child('role').val() == 'admin')",
      ".write": "auth != null && (newData.child('senderId').val() == auth.uid || root.child('users').child(auth.uid).child('role').val() == 'admin')",
      ".validate": "newData.hasChildren(['id', 'conversationId', 'senderId', 'content', 'timestamp', 'isRead'])"
    }
  }
}
```

#### Conversations
```json
"conversations": {
  "$conversationId": {
    ".read": "auth != null && (data.child('participants').child(auth.uid).exists() || root.child('users').child(auth.uid).child('role').val() == 'admin')",
    ".write": "auth != null && (data.child('participants').child(auth.uid).exists() || root.child('users').child(auth.uid).child('role').val() == 'admin')",
    ".validate": "newData.hasChildren(['id', 'participants', 'lastMessage', 'lastMessageTime', 'lastSenderId', 'unreadCount', 'createdAt'])"
  }
}
```

#### User Conversations
```json
"user-conversations": {
  "$userId": {
    ".read": "auth != null && (auth.uid == $userId || root.child('users').child(auth.uid).child('role').val() == 'admin')",
    ".write": "auth != null && (auth.uid == $userId || root.child('users').child(auth.uid).child('role').val() == 'admin')",
    "$conversationId": {
      ".read": "auth != null && (auth.uid == $userId || root.child('users').child(auth.uid).child('role').val() == 'admin')",
      ".write": "auth != null && (auth.uid == $userId || root.child('users').child(auth.uid).child('role').val() == 'admin')"
    }
  }
}
```

## 2. Firestore Rules (Nếu sử dụng)

### Cách cập nhật:
1. Vào **Firestore Database** > **Rules**
2. Copy nội dung từ file `firestore_rules.rules`
3. Paste vào editor và click **Publish**

### Rules chính cho messaging:

#### Messages Collection
```javascript
match /messages/{messageId} {
  allow read: if request.auth != null && (
    resource.data.senderId == request.auth.uid || 
    resource.data.receiverId == request.auth.uid ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
  allow create: if request.auth != null && request.resource.data.senderId == request.auth.uid;
  allow update: if request.auth != null && (
    resource.data.senderId == request.auth.uid ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
  allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

#### Conversations Collection
```javascript
match /conversations/{conversationId} {
  allow read: if request.auth != null && (
    request.auth.uid in resource.data.participants ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
  allow write: if request.auth != null && (
    request.auth.uid in resource.data.participants ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
}
```

## 3. Giải thích Rules

### Bảo mật:
- **Authentication**: Tất cả operations đều yêu cầu user đã đăng nhập
- **Authorization**: Chỉ participants trong conversation mới có thể đọc/ghi tin nhắn
- **Admin Access**: Admin có thể truy cập tất cả conversations và messages
- **Data Validation**: Validate cấu trúc dữ liệu trước khi lưu

### Quyền truy cập:
- **Users**: Chỉ có thể đọc/ghi tin nhắn của mình
- **Participants**: Có thể đọc/ghi tin nhắn trong conversation của mình
- **Admins**: Có thể truy cập tất cả conversations và messages

## 4. Cấu trúc dữ liệu được hỗ trợ

### Messages
```json
{
  "id": "message_id",
  "conversationId": "conversation_id",
  "senderId": "user_id",
  "content": "message content",
  "timestamp": 1234567890,
  "isRead": false
}
```

### Conversations
```json
{
  "id": "conversation_id",
  "participants": {
    "user1_id": true,
    "user2_id": true
  },
  "lastMessage": "last message content",
  "lastMessageTime": 1234567890,
  "lastSenderId": "user_id",
  "unreadCount": 5,
  "createdAt": 1234567890
}
```

## 5. Testing Rules

### Test Cases:
1. **User gửi tin nhắn**: ✅ Có thể gửi tin nhắn trong conversation của mình
2. **User đọc tin nhắn**: ✅ Có thể đọc tin nhắn trong conversation của mình
3. **User truy cập conversation khác**: ❌ Không thể truy cập
4. **Admin truy cập**: ✅ Có thể truy cập tất cả
5. **Unauthenticated user**: ❌ Không thể truy cập

### Cách test:
1. Sử dụng Firebase Console > Realtime Database > Rules Playground
2. Test các scenarios khác nhau
3. Verify rules hoạt động đúng

## 6. Troubleshooting

### Lỗi thường gặp:
1. **Permission denied**: Kiểm tra user authentication và role
2. **Validation failed**: Kiểm tra cấu trúc dữ liệu
3. **Admin access denied**: Kiểm tra user role trong database

### Debug:
1. Kiểm tra Firebase Console > Authentication
2. Kiểm tra user role trong Realtime Database
3. Sử dụng Rules Playground để test

## 7. Lưu ý quan trọng

- **Backup rules cũ** trước khi cập nhật
- **Test kỹ** trước khi deploy production
- **Monitor logs** sau khi cập nhật
- **Update client code** nếu cần thiết 