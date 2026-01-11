# Tính năng Card Bài Thi - Hướng dẫn sử dụng

## Tổng quan

Hệ thống đã được cập nhật với giao diện card bài thi hiện đại, hiển thị đầy đủ thông tin và quản lý số lượt thi thông minh.

## Tính năng mới

### 1. Card Bài Thi (TestCard.tsx)

#### Thông tin hiển thị:
- **Tên bài thi** và mô tả
- **Badge trạng thái**: Xem đáp án, Chống gian lận
- **Thống kê 4 cột**:
  - Số câu hỏi
  - Thời gian làm bài
  - Điểm tối đa
  - Số lượt thi đã sử dụng/tối đa

#### Kết quả gần nhất:
- Hiển thị điểm số và thời gian nộp bài gần nhất
- Màu sắc thay đổi theo điểm (xanh = đạt, đỏ = không đạt)

#### Cài đặt bài thi:
- Xáo trộn câu hỏi
- Cảnh báo chuyển tab
- Số lần thi tối đa

#### Nút hành động:
- **"Bắt đầu làm bài"**: Khi còn lượt thi
- **"Đã hết lượt thi"**: Khi hết lượt (disabled)
- **"Xem kết quả"**: Khi đã có kết quả

### 2. Quản lý số lượt thi

#### Backend APIs:
```java
// Lấy số lượt thi đã sử dụng
GET /api/exam-results/attempt-count/{userName}/{testName}

// Kiểm tra có thể thi không
GET /api/exam-results/can-take-test/{userName}/{testName}/{maxRetake}
```

#### Logic tính toán:
- Đếm số bản ghi trong `exam_results` collection
- So sánh với `maxRetake` từ đề thi
- Tự động cập nhật sau mỗi lần nộp bài

### 3. Giao diện kết quả cải tiến

#### UserCourseResults.tsx:
- **Layout card hiện đại** với thông tin chi tiết
- **Filter theo bài thi** để xem kết quả cụ thể
- **Thống kê trực quan**: Điểm, câu đúng, câu sai
- **Badge đạt/không đạt** dựa trên điểm số

#### Tính năng filter:
- Dropdown chọn bài thi cụ thể
- URL params hỗ trợ: `?testId=xxx`
- Tự động filter khi từ card bài thi chuyển sang

### 4. Nút thoát ra màn hình kết quả

#### Trong UserForm.tsx:
- **Modal kết quả tổng quan**: 3 nút
  - Xem chi tiết
  - Xem lại bài làm
  - **Thoát ra màn hình kết quả** (mới)

#### Trong ExamResultDetail.tsx:
- **Modal chi tiết**: 2 nút
  - Đóng
  - **Thoát ra màn hình kết quả** (mới)

## Cách sử dụng

### Cho User:

1. **Xem danh sách bài thi**:
   - Vào khóa học → Tab "Bài thi"
   - Xem thông tin đầy đủ trên card
   - Kiểm tra số lượt thi còn lại

2. **Làm bài thi**:
   - Click "Bắt đầu làm bài" nếu còn lượt
   - Làm bài theo thời gian quy định
   - Nộp bài và xem kết quả

3. **Xem kết quả**:
   - Click "Xem kết quả" trên card
   - Hoặc vào tab "Kết quả" để xem tất cả
   - Filter theo bài thi cụ thể

4. **Sau khi làm bài**:
   - Xem kết quả tổng quan
   - Xem chi tiết từng câu (nếu được phép)
   - Thoát ra màn hình kết quả để xem tất cả

### Cho Admin:

1. **Tạo bài thi**:
   - Đặt `maxRetake` để giới hạn số lượt
   - Cấu hình `showAnswerAfterSubmit` để cho phép xem đáp án
   - Thiết lập các tính năng bảo mật

2. **Theo dõi kết quả**:
   - Xem số lượt thi của từng user
   - Kiểm tra điểm số và thời gian nộp
   - Export dữ liệu thống kê

## Cấu trúc dữ liệu

### Firebase Collections:

#### `parts` (Đề thi):
```json
{
  "id": "test123",
  "name": "Bài thi giữa kỳ",
  "maxRetake": 2,
  "showAnswerAfterSubmit": true,
  "enableAntiCheat": true,
  "duration": 60,
  "score": 10
}
```

#### `exam_results` (Kết quả thi):
```json
{
  "userName": "user123",
  "testName": "test123",
  "score": 8.5,
  "submittedAt": "2025-01-15T10:30:00Z",
  "totalQuestions": 6,
  "answeredQuestions": 5,
  "correctAnswers": 4
}
```

## Tính năng bảo mật

### 1. Kiểm tra lượt thi:
- Backend validate trước khi cho phép thi
- Frontend disable nút khi hết lượt
- Real-time update sau mỗi lần nộp

### 2. Hiển thị đáp án:
- Chỉ hiển thị khi `showAnswerAfterSubmit = true`
- Kiểm tra quyền trước khi hiển thị
- Ẩn đáp án đúng nếu không được phép

### 3. Chống gian lận:
- Theo dõi số lần chuyển tab
- Giới hạn thời gian làm bài
- Xáo trộn câu hỏi (nếu bật)

## Cải tiến có thể thực hiện

### 1. Giao diện:
- Animation khi load card
- Skeleton loading cho thông tin
- Dark mode support

### 2. Tính năng:
- Export kết quả PDF
- Gửi email thông báo kết quả
- Thống kê biểu đồ

### 3. Bảo mật:
- Captcha trước khi thi
- Webcam monitoring
- Screen recording detection

## Troubleshooting

### Lỗi thường gặp:

1. **Card không load thông tin**:
   - Kiểm tra kết nối backend
   - Verify user authentication
   - Check Firebase permissions

2. **Số lượt thi không đúng**:
   - Clear cache browser
   - Kiểm tra dữ liệu Firebase
   - Verify API responses

3. **Không thể thi khi còn lượt**:
   - Kiểm tra `maxRetake` setting
   - Verify user permissions
   - Check backend logs

### Debug:

```javascript
// Kiểm tra thông tin user
console.log('Current user:', auth.currentUser);

// Kiểm tra API response
const response = await axios.get('/api/exam-results/attempt-count/...');
console.log('Attempt count:', response.data);

// Kiểm tra Firebase data
// Xem trực tiếp trong Firebase Console
```

## Kết luận

Hệ thống card bài thi mới cung cấp:
- **Giao diện hiện đại** và dễ sử dụng
- **Quản lý lượt thi thông minh**
- **Hiển thị thông tin đầy đủ**
- **Navigation mượt mà** giữa các màn hình
- **Bảo mật cao** với nhiều lớp kiểm tra

Tính năng này giúp user có trải nghiệm làm bài thi tốt hơn và admin dễ dàng quản lý hệ thống. 