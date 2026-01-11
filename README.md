
---

## ⚡️ Cài đặt & chạy local

### 1. Cài đặt Node.js, Java 17, Maven

### 2. Cài đặt frontend

```bash
cd DoAnLN/frontend
npm install
npm run dev
```
- Sửa file `.env` nếu cần cấu hình API_URL, Firebase...

### 3. Cài đặt backend

```bash
cd DoAnLN/backend
mvn clean install
mvn spring-boot:run
```
- Sửa `application.properties` để trỏ đúng Firebase serviceAccountKey, databaseURL...

---

## 🔥 Cấu hình Firebase

### 1. Tạo project Firebase, bật Realtime Database & Firestore

### 2. Cấu hình Rules

- **Realtime Database:**  
  Vào Firebase Console > Realtime Database > Rules  
  Copy nội dung từ `firebase-realtime-rules.json` vào và Publish.

- **Firestore:**  
  Vào Firestore > Rules  
  Copy nội dung từ `firestore_rules_complete.rules` vào và Publish.

### 3. Tải file `serviceAccountKey.json` về và đặt vào `backend/src/main/resources/`

### 4. Sửa `application.properties`:
```properties
firebase.realtime.database.url=https://<your-project-id>-default-rtdb.firebaseio.com
```

---

## 🧩 Các chức năng chính

### 1. Quản lý khóa học, ngân hàng đề, bài thi
- Tạo/sửa/xóa khóa học, ngân hàng đề, bài thi
- Import câu hỏi từ Excel

### 2. Làm bài thi, chấm điểm tự động
- Hỗ trợ nhiều loại câu hỏi: trắc nghiệm, đúng/sai, nhiều đáp án, điền khuyết, ghép nối...
- Chấm điểm tự động, tính điểm theo từng loại câu hỏi

### 3. Phân tích kết quả, thống kê
- Xem lại kết quả, phân tích điểm, biểu đồ, xuất Excel/PDF

### 4. Thông báo realtime
- Push notification khi có bài thi mới, được thêm vào lớp, điểm số...
- Badge thông báo chưa đọc trên sidebar, cập nhật realtime

### 5. Quản lý người dùng, phân quyền
- Đăng ký, đăng nhập, phân quyền user/admin
- Quản lý profile, đổi mật khẩu, quên mật khẩu

---

## 🔒 Bảo mật & Rule Firebase

- **Chỉ user được đọc/ghi dữ liệu của mình**
- **Admin có quyền truy cập toàn bộ**
- **Validate dữ liệu khi ghi**
- **Realtime Database & Firestore đều có rule bảo mật chặt chẽ**

---

## 🛠️ API Backend tiêu biểu

- `POST /api/exam-results/submit-and-get-result` - Nộp bài, chấm điểm, trả kết quả
- `GET /api/exam-results` - Lấy danh sách kết quả (admin)
- `GET /api/notifications/user/{userId}` - Lấy thông báo của user
- `PUT /api/notifications/user/{userId}/notification/{notificationId}/read` - Đánh dấu đã đọc
- `PUT /api/notifications/user/{userId}/read-all` - Đánh dấu tất cả đã đọc
- `GET /api/notifications/user/{userId}/unread-count` - Số lượng chưa đọc

---

## 🧑‍💻 Hướng dẫn dev mở rộng

- **Thêm loại câu hỏi mới:**  
  Sửa backend (ExamResultService.java), frontend (UserForm.tsx)
- **Thêm tính năng notification:**  
  Sửa NotificationService.java, NotificationController.java, notificationService.ts, Sidebar.tsx
- **Tích hợp thêm provider đăng nhập:**  
  Sửa firebase-config.ts, AuthForm.tsx

---

## 🐞 Troubleshooting & Debug

- **Không push được notification:**  
  Kiểm tra Firebase Admin SDK, serviceAccountKey, rule, log backend
- **Không hiển thị notification:**  
  Kiểm tra rule, authentication, console error
- **Chấm điểm sai:**  
  Kiểm tra logic ExamResultService.java, cấu trúc đề thi Firebase
- **Lỗi quyền truy cập:**  
  Kiểm tra rule, role user trong database

---

## 📚 Tài liệu tham khảo

- [EXAM_SYSTEM_GUIDE.md](./EXAM_SYSTEM_GUIDE.md) - Luồng nghiệp vụ, cấu trúc đề thi, API
- [FIREBASE_REALTIME_SETUP.md](./FIREBASE_REALTIME_SETUP.md) - Hướng dẫn cấu hình Realtime Database
- [FIREBASE_RULES_SETUP.md](./FIREBASE_RULES_SETUP.md) - Hướng dẫn cập nhật rule bảo mật
- [NOTIFICATION_SETUP_GUIDE.md](./NOTIFICATION_SETUP_GUIDE.md) - Hướng dẫn cấu hình notification
- [firebase-realtime-rules.json](./firebase-realtime-rules.json) - Rule Realtime Database
- [firestore_rules_complete.rules](./firestore_rules_complete.rules) - Rule Firestore

---

## 💡 Ghi chú

- **Backup rule cũ trước khi cập nhật**
- **Test kỹ trên môi trường dev trước khi deploy production**
- **Theo dõi log backend và Firebase Console khi có lỗi**

---

Chúc bạn thành công với QuizSpark!  
Nếu có vấn đề, hãy đọc kỹ các file hướng dẫn hoặc liên hệ admin dự án.
