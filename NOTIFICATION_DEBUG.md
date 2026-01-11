# Hướng dẫn Debug Notification

## Vấn đề
Khi tạo bài thi mới, notification không xuất hiện trong giao diện thông báo.

## Các bước debug

### 1. Kiểm tra Backend Logs
Khi tạo bài thi mới, kiểm tra console backend để xem các log sau:

```
[NOTIFICATION] Bắt đầu push notification cho bài thi mới: [Tên bài thi]
[NOTIFICATION] Course ID: [Course ID]
[NOTIFICATION] Tìm thấy course: [Tên course]
[NOTIFICATION] Danh sách students: [Danh sách student IDs]
[NOTIFICATION] Nội dung notification:
[NOTIFICATION] Title: Bài thi mới
[NOTIFICATION] Message: Bạn có bài thi mới: "[Tên bài thi]" trong lớp "[Tên lớp]"
[NOTIFICATION] Type: exam_created
[NOTIFICATION] Related ID: [Part ID]
[NOTIFICATION_SERVICE] Bắt đầu push notification cho X users
[NOTIFICATION_SERVICE] Title: Bài thi mới
[NOTIFICATION_SERVICE] Message: Bạn có bài thi mới: "[Tên bài thi]" trong lớp "[Tên lớp]"
[NOTIFICATION_SERVICE] Type: exam_created
[NOTIFICATION_SERVICE] Related ID: [Part ID]
[NOTIFICATION_SERVICE] Push notification cho user: [User ID]
[NOTIFICATION_SERVICE] Notification data: {...}
[NOTIFICATION_SERVICE] Database path: notifications/[User ID]/[Notification ID]
Đã push notification cho user [User ID]: Bài thi mới
[NOTIFICATION_SERVICE] Hoàn thành push notification cho tất cả users
```

### 2. Kiểm tra Firebase Realtime Database
1. Vào Firebase Console
2. Chọn Realtime Database
3. Kiểm tra xem có dữ liệu notification được tạo không:
   ```
   notifications/
     [user_id]/
       [notification_id]/
         id: [notification_id]
         userId: [user_id]
         title: "Bài thi mới"
         message: "Bạn có bài thi mới: ..."
         type: "exam_created"
         relatedId: [part_id]
         isRead: false
         createdAt: [timestamp]
   ```

### 3. Test Notification bằng API
Sử dụng Postman hoặc curl để test API:

#### Test single notification:
```bash
curl -X POST https://doanln.onrender.com/api/test/notification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_id",
    "title": "Test Notification",
    "message": "Đây là notification test",
    "type": "test"
  }'
```

#### Test exam notification:
```bash
curl -X POST https://doanln.onrender.com/api/test/exam-notification \
  -H "Content-Type: application/json" \
  -d '{
    "examName": "Bài thi Test",
    "courseName": "Lớp Test",
    "studentIds": ["student1", "student2"]
  }'
```

### 4. Kiểm tra Frontend
1. Mở Developer Tools (F12)
2. Vào tab Console
3. Kiểm tra xem có lỗi JavaScript không
4. Vào tab Network để xem các request API

### 5. Kiểm tra Firebase Rules
Đảm bảo rules cho phép đọc/ghi notification:

```json
{
  "rules": {
    "notifications": {
      "$userId": {
        ".read": "$userId === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".write": "$userId === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    }
  }
}
```

### 6. Các nguyên nhân có thể

#### A. Course không có students
- Kiểm tra xem course có danh sách students không
- Log: "Không có students nào trong course: [Tên course]"

#### B. Lỗi Firebase Database URL
- Kiểm tra `application.properties` có `firebase.database.url` không
- Đảm bảo URL đúng format: `https://[project-id].firebaseio.com`

#### C. Lỗi Firebase Authentication
- Kiểm tra service account key có quyền truy cập Realtime Database
- Đảm bảo project có Realtime Database được tạo

#### D. Lỗi Frontend Realtime Listener
- Kiểm tra component Notification có lắng nghe đúng path không
- Đảm bảo user đã đăng nhập và có auth.uid

### 7. Test Component
Sử dụng component TestNotification trong AdminPage để test:
1. Vào AdminPage
2. Click nút "Test Notification" (góc trên bên phải)
3. Thử các loại notification khác nhau

### 8. Debug Commands

#### Restart Backend:
```bash
cd backend
mvn spring-boot:run
```

#### Check Firebase Connection:
```bash
# Test Firebase connection
curl -X GET https://[project-id].firebaseio.com/.json
```

#### Monitor Backend Logs:
```bash
# Theo dõi logs realtime
tail -f backend/logs/application.log
```

## Kết quả mong đợi
Sau khi debug thành công:
1. Backend logs hiển thị đầy đủ thông tin notification
2. Firebase Realtime Database có dữ liệu notification
3. Frontend hiển thị notification realtime
4. Badge notification cập nhật số lượng
5. Click vào notification hiển thị chi tiết

## Liên hệ hỗ trợ
Nếu vẫn gặp vấn đề, cung cấp:
1. Backend logs đầy đủ
2. Screenshot Firebase Console
3. Frontend console logs
4. Network requests 