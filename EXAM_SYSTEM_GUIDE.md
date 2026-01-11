# Hướng dẫn hệ thống làm bài thi

## Tổng quan

Hệ thống làm bài thi được thiết kế để xử lý các loại câu hỏi khác nhau với tính toán điểm chính xác và lưu trữ kết quả vào Firebase.

## Cấu trúc đề thi Firebase

```json
{
  "id": "rS9ggclCDJDjqhfveDYp",
  "courseId": "6hxNJJMIkBDh0YAOthfT",
  "name": "Thi giữa kì môn lập trình C",
  "description": "",
  "createdAt": "2025-07-10T00:05:57+07:00",
  "duration": 60,
  "maxRetake": 1,
  "enableAntiCheat": true,
  "enableTabWarning": true,
  "randomizeQuestions": true,
  "showAnswerAfterSubmit": true,
  "score": 10,
  "questions": [
    {
      "id": "IFTf16F351jWB45GcYvI",
      "content": "Hà Nội là thủ đô Việt Nam?",
      "level": "easy",
      "type": "truefalse",
      "score": 2,
      "options": [
        { "text": "Đúng", "correct": true },
        { "text": "Sai", "correct": false }
      ]
    }
  ]
}
```

## Các loại câu hỏi được hỗ trợ

### 1. Câu hỏi đúng/sai (truefalse)
- **Type**: `"truefalse"` hoặc `"true_false"`
- **Logic**: Chỉ chọn 1 đáp án đúng
- **Tính điểm**: Đúng = điểm câu hỏi, Sai = 0 điểm

### 2. Câu hỏi một lựa chọn (single)
- **Type**: `"single"` hoặc `"single_choice"`
- **Logic**: Chỉ chọn 1 đáp án đúng
- **Tính điểm**: Đúng = điểm câu hỏi, Sai = 0 điểm

### 3. Câu hỏi nhiều lựa chọn (multiple)
- **Type**: `"multiple"` hoặc `"multiple_choice"`
- **Logic**: Phải chọn đúng tất cả đáp án đúng và không chọn đáp án sai
- **Tính điểm**: 
  - Đúng hoàn toàn = điểm câu hỏi
  - Chọn đáp án sai = trừ điểm theo tỷ lệ
  - Sai = 0 điểm

## Cơ chế tính điểm

### Backend (ExamResultService.java)

1. **Lấy đề thi từ Firebase**: Sử dụng `PartService.getPartById()`
2. **Đảm bảo options có ID**: Tự động tạo ID nếu chưa có
3. **So sánh đáp án**: Dựa trên loại câu hỏi
4. **Tính điểm**: Áp dụng logic tính điểm cho từng loại
5. **Lưu kết quả**: Vào Firebase và memory cache

### Frontend (UserForm.tsx)

1. **Hiển thị câu hỏi**: Theo thứ tự hoặc ngẫu nhiên
2. **Thu thập đáp án**: Lưu vào state `answers`
3. **Gửi kết quả**: POST đến `/api/exam-results/submit-and-get-result`
4. **Hiển thị kết quả**: Modal tổng quan và chi tiết

## API Endpoints

### 1. Nộp bài và tính điểm
```
POST /api/exam-results/submit-and-get-result
```

**Request Body:**
```json
{
  "userName": "user123",
  "testName": "rS9ggclCDJDjqhfveDYp",
  "submittedAt": "2025-01-15T10:30:00Z",
  "status": "submitted",
  "details": [
    {
      "questionId": "IFTf16F351jWB45GcYvI",
      "question": "Hà Nội là thủ đô Việt Nam?",
      "optionIds": "opt_0"
    }
  ]
}
```

**Response:**
```json
{
  "id": "result123",
  "userName": "user123",
  "testName": "rS9ggclCDJDjqhfveDYp",
  "score": 8.5,
  "submittedAt": "2025-01-15T10:30:00Z",
  "status": "submitted",
  "details": [
    {
      "questionId": "IFTf16F351jWB45GcYvI",
      "question": "Hà Nội là thủ đô Việt Nam?",
      "answer": "A. Đúng",
      "optionIds": "opt_0",
      "correct": true,
      "point": 2.0
    }
  ]
}
```

### 2. Lấy danh sách kết quả (Admin)
```
GET /api/exam-results
```

## Cấu trúc dữ liệu kết quả

### ExamResult
- `id`: ID kết quả
- `userName`: Tên người dùng
- `testName`: ID đề thi
- `score`: Tổng điểm
- `submittedAt`: Thời gian nộp
- `status`: Trạng thái ('submitted' | 'not_submitted')
- `details`: Chi tiết từng câu hỏi

### ExamResult.Detail
- `questionId`: ID câu hỏi
- `question`: Nội dung câu hỏi
- `answer`: Đáp án của user (dạng text)
- `optionIds`: ID các option được chọn
- `correct`: Đúng/sai
- `point`: Điểm câu hỏi

## Tính năng bảo mật

1. **Chống gian lận**: Theo dõi số lần chuyển tab
2. **Giới hạn thời gian**: Tự động nộp khi hết giờ
3. **Giới hạn số lần thi**: Theo `maxRetake`
4. **Xáo trộn câu hỏi**: Theo `randomizeQuestions`

## Hiển thị kết quả

### 1. Modal tổng quan
- Tổng số câu
- Số câu đúng/sai
- Điểm số
- Nút xem chi tiết

### 2. Modal chi tiết (ExamResultDetail.tsx)
- Thống kê chi tiết
- Từng câu hỏi với đáp án
- Điểm từng câu
- Cảnh báo câu chưa trả lời

## Lưu trữ Firebase

### Collection: `exam_results`
```json
{
  "userName": "user123",
  "testName": "rS9ggclCDJDjqhfveDYp",
  "score": 8.5,
  "submittedAt": "2025-01-15T10:30:00Z",
  "status": "submitted",
  "details": [...],
  "totalQuestions": 6,
  "answeredQuestions": 5,
  "correctAnswers": 4
}
```

## Xử lý lỗi

1. **Không tìm thấy đề thi**: Throw RuntimeException
2. **Không có câu trả lời**: Throw RuntimeException
3. **Lỗi Firebase**: Log warning, tiếp tục xử lý
4. **Lỗi network**: Hiển thị alert cho user

## Cải tiến có thể thực hiện

1. **Thêm loại câu hỏi**: Essay, matching, etc.
2. **Tính điểm theo trọng số**: Dựa trên độ khó
3. **Phân tích thống kê**: Biểu đồ, báo cáo
4. **Export kết quả**: PDF, Excel
5. **Real-time monitoring**: Theo dõi thời gian thực
6. **Anti-cheat nâng cao**: Webcam, screen recording

## Hướng dẫn sử dụng

### Cho Admin
1. Tạo đề thi với cấu trúc Firebase
2. Xem kết quả tại `/admin/exam-results`
3. Export dữ liệu thống kê

### Cho User
1. Chọn đề thi từ danh sách
2. Làm bài theo thời gian quy định
3. Nộp bài và xem kết quả
4. Xem lại chi tiết từng câu

## Troubleshooting

### Lỗi thường gặp
1. **Options không có ID**: Tự động tạo ID dựa trên index
2. **Type câu hỏi không đúng**: Mặc định xử lý như single choice
3. **Score null**: Mặc định = 1.0 điểm
4. **Firebase connection**: Fallback về memory cache

### Debug
- Log chi tiết trong console backend
- Kiểm tra Network tab trong browser
- Verify cấu trúc Firebase data 