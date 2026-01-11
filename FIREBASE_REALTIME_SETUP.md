# Hướng dẫn cấu hình Firebase Realtime Database

## Lỗi hiện tại
```
Caused by: com.google.firebase.database.DatabaseException: Failed to get FirebaseDatabase instance: Specify DatabaseURL within FirebaseApp or from your getInstance() call.
```

## Giải pháp

### 1. Kiểm tra Firebase Console
1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project `liennganh-e70a0`
3. Vào **Realtime Database** trong menu bên trái
4. Kiểm tra URL database (thường là `https://liennganh-e70a0-default-rtdb.firebaseio.com`)

### 2. Cập nhật application.properties
Nếu URL khác với mặc định, thêm vào `application.properties`:
```properties
firebase.realtime.database.url=https://your-actual-database-url.firebaseio.com
```

### 3. Cập nhật FirebaseConfig.java
Nếu có URL tùy chỉnh, cập nhật:
```java
@Value("${firebase.realtime.database.url:https://${firebase.project.id}-default-rtdb.firebaseio.com}")
private String databaseUrl;
```

### 4. Tạo Realtime Database (nếu chưa có)
1. Trong Firebase Console > Realtime Database
2. Click **Create Database**
3. Chọn location (gần nhất với server)
4. Chọn **Start in test mode** (tạm thời)
5. Copy URL database

### 5. Cấu hình Rules
Copy rules từ `firebase-realtime-rules.json` vào Firebase Console > Realtime Database > Rules

### 6. Test kết nối
Sau khi cấu hình, chạy lại backend:
```bash
mvn spring-boot:run
```

## Troubleshooting

### Nếu vẫn lỗi DatabaseURL:
1. Kiểm tra project ID trong `application.properties`
2. Đảm bảo Realtime Database đã được tạo
3. Kiểm tra serviceAccountKey.json có quyền truy cập Realtime Database

### Nếu lỗi authentication:
1. Kiểm tra serviceAccountKey.json
2. Đảm bảo service account có quyền Realtime Database Admin

### Nếu lỗi rules:
1. Tạm thời set rules thành:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
2. Sau đó áp dụng rules bảo mật từ `firebase-realtime-rules.json` 