# Hộp thư Admin - Hướng dẫn sử dụng

## Tổng quan
Chức năng hộp thư cho Admin cho phép quản trị viên gửi tin nhắn realtime đến tất cả người dùng trong hệ thống.

## Tính năng chính

### 1. Xem danh sách người dùng
- Hiển thị tất cả người dùng trong hệ thống (trừ admin hiện tại)
- Thông tin hiển thị: Ảnh đại diện, tên, email, vai trò
- Số tin nhắn chưa đọc được hiển thị bên cạnh mỗi người dùng

### 2. Tìm kiếm người dùng
- Tìm kiếm theo email
- Kết quả tìm kiếm hiển thị ngay lập tức
- Có thể gửi tin nhắn trực tiếp từ kết quả tìm kiếm

### 3. Gửi tin nhắn realtime
- Modal chat với giao diện thân thiện
- Gửi tin nhắn realtime qua Firebase
- Hiển thị thời gian gửi tin nhắn
- Phân biệt tin nhắn gửi và nhận

### 4. Thông báo tin nhắn chưa đọc
- Badge đỏ hiển thị số tin nhắn chưa đọc
- Cập nhật realtime khi có tin nhắn mới

## Cách sử dụng

### Truy cập hộp thư
1. Đăng nhập vào hệ thống với tài khoản Admin
2. Trong sidebar, click vào mục "Hộp thư" (icon envelope)
3. Giao diện hộp thư sẽ hiển thị

### Gửi tin nhắn
1. **Từ danh sách người dùng:**
   - Tìm người dùng muốn gửi tin nhắn
   - Click vào icon chat (💬) bên cạnh tên người dùng
   - Modal chat sẽ mở ra

2. **Từ tìm kiếm:**
   - Nhập email người dùng vào ô tìm kiếm
   - Click "Tìm kiếm"
   - Click "Gửi tin nhắn" trong kết quả tìm kiếm

### Trong modal chat
- Nhập tin nhắn vào ô input
- Nhấn Enter hoặc click "Gửi" để gửi tin nhắn
- Tin nhắn sẽ được gửi realtime
- Click "X" để đóng modal

## Cấu trúc dữ liệu

### UserInfo Interface
```typescript
interface UserInfo {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL: string;
  role: string;
}
```

### Message Interface
```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  senderName?: string;
  senderEmail?: string;
}
```

## API Endpoints

### Backend APIs
- `GET /api/users/all` - Lấy danh sách tất cả users
- `POST /api/messages/send` - Gửi tin nhắn
- `GET /api/messages/conversation/{id}` - Lấy tin nhắn của conversation
- `GET /api/messages/unread-count/{userId}` - Lấy số tin nhắn chưa đọc
- `GET /api/messages/find-user/{email}` - Tìm user theo email
- `GET /api/messages/user-info/{userId}` - Lấy thông tin user

## Firebase Realtime Database

### Cấu trúc dữ liệu
```
messages/
  {conversationId}/
    {messageId}/
      content: string
      senderId: string
      timestamp: number
      isRead: boolean
```

## Lưu ý kỹ thuật

### Dependencies
- `date-fns` - Xử lý thời gian
- `react-toastify` - Hiển thị thông báo
- `axios` - Gọi API
- `firebase` - Realtime Database

### Performance
- Lazy loading danh sách users
- Caching unread counts
- Realtime updates qua Firebase listeners

### Security
- Xác thực qua Firebase Auth
- Kiểm tra quyền admin
- Validate input trước khi gửi

## Troubleshooting

### Lỗi thường gặp
1. **Không tải được danh sách users**
   - Kiểm tra kết nối backend
   - Kiểm tra quyền admin

2. **Không gửi được tin nhắn**
   - Kiểm tra kết nối Firebase
   - Kiểm tra cấu hình Firebase

3. **Không hiển thị realtime**
   - Kiểm tra Firebase listeners
   - Kiểm tra cấu hình Realtime Database

### Debug
- Mở Developer Tools để xem console logs
- Kiểm tra Network tab để debug API calls
- Kiểm tra Firebase Console để debug Realtime Database 