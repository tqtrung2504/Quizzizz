# Hướng dẫn cấu hình hệ thống Notification

## Tổng quan
Hệ thống notification đã được triển khai với các tính năng:
- Push notification realtime khi admin tạo bài thi mới
- Push notification khi admin thêm user vào lớp
- Hiển thị số lượng notification chưa đọc trên sidebar
- Quản lý notification (đánh dấu đã đọc, xóa)

## Cấu hình Firebase Realtime Database

### 1. Cấu hình Rules
Copy nội dung từ file `firebase-realtime-rules.json` và paste vào Firebase Console > Realtime Database > Rules:

```json
{
  "rules": {
    "notifications": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId",
        "$notificationId": {
          ".read": "auth != null && auth.uid == $userId",
          ".write": "auth != null && auth.uid == $userId",
          ".validate": "newData.hasChildren(['id', 'userId', 'title', 'message', 'type', 'isRead', 'createdAt'])"
        }
      }
    },
    "exam-violations": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'student'"
    },
    "users": {
      "$userId": {
        ".read": "auth != null && (auth.uid == $userId || root.child('users').child(auth.uid).child('role').val() == 'admin')",
        ".write": "auth != null && (auth.uid == $userId || root.child('users').child(auth.uid).child('role').val() == 'admin')"
      }
    },
    "courses": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'"
    },
    "parts": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'"
    },
    "questionBanks": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'"
    },
    "questions": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'"
    },
    "examResults": {
      "$resultId": {
        ".read": "auth != null && ((data.child('userName').val() == auth.token.email || data.child('userName').val() == auth.uid) || root.child('users').child(auth.uid).child('role').val() == 'admin')",
        ".write": "auth != null && (newData.child('userName').val() == auth.token.email || newData.child('userName').val() == auth.uid)"
      }
    }
  }
}
```

### 2. Cấu trúc dữ liệu
Notifications sẽ được lưu theo cấu trúc:
```
notifications/
  {userId}/
    {notificationId}/
      id: string
      userId: string
      title: string
      message: string
      type: string (exam_created, course_added, general)
      relatedId: string (optional)
      isRead: boolean
      createdAt: timestamp
      readAt: timestamp (optional)
```

## Backend Configuration

### 1. Dependencies
Đảm bảo đã thêm Firebase Admin SDK trong `pom.xml`:
```xml
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.1.1</version>
</dependency>
```

### 2. Files đã tạo/cập nhật:
- `Notification.java` - Model notification
- `NotificationService.java` - Service xử lý notification
- `NotificationController.java` - API endpoints
- `PartService.java` - Cập nhật để push notification khi tạo bài thi
- `CourseService.java` - Cập nhật để push notification khi thêm user

### 3. API Endpoints
```
GET /api/notifications/user/{userId} - Lấy notifications của user
PUT /api/notifications/user/{userId}/notification/{notificationId}/read - Đánh dấu đã đọc
DELETE /api/notifications/user/{userId}/notification/{notificationId} - Xóa notification
PUT /api/notifications/user/{userId}/read-all - Đánh dấu tất cả đã đọc
GET /api/notifications/user/{userId}/unread-count - Số lượng chưa đọc
```

## Frontend Configuration

### 1. Files đã tạo/cập nhật:
- `services/notificationService.ts` - Service gọi API notification
- `AdminPage/left-bar/Sidebar.tsx` - Hiển thị số notification chưa đọc
- `AdminPage/Notification.tsx` - Component quản lý notification

### 2. Tính năng đã triển khai:
- Hiển thị badge số lượng notification chưa đọc trên sidebar
- Tab quản lý notification với danh sách và actions
- Realtime listening cho notifications mới
- Đánh dấu đã đọc/xóa notification

## Testing

### 1. Test tạo bài thi
1. Đăng nhập admin
2. Tạo bài thi mới trong một course có students
3. Kiểm tra notification được push cho tất cả students

### 2. Test thêm user vào lớp
1. Đăng nhập admin
2. Thêm user vào một course
3. Kiểm tra notification được push cho user đó

### 3. Test frontend
1. Đăng nhập user
2. Kiểm tra badge notification trên sidebar
3. Vào trang notification để xem danh sách
4. Test các actions (đánh dấu đã đọc, xóa)

## Troubleshooting

### 1. Notification không được push
- Kiểm tra Firebase Admin SDK configuration
- Kiểm tra serviceAccountKey.json
- Kiểm tra logs backend

### 2. Frontend không hiển thị notification
- Kiểm tra Firebase Realtime Database rules
- Kiểm tra authentication
- Kiểm tra console errors

### 3. API errors
- Kiểm tra backend logs
- Kiểm tra CORS configuration
- Kiểm tra authentication headers

## Security Notes
- Rules đảm bảo user chỉ đọc/ghi notifications của chính mình
- Admin có quyền đọc/ghi tất cả dữ liệu
- Validation rules cho notification data structure
- Authentication required cho tất cả operations 