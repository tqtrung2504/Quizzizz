package com.yourcompany.onlineexam.service;

import com.yourcompany.onlineexam.model.ExamResult;
import com.yourcompany.onlineexam.model.Part;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import java.util.Map;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;
import java.util.concurrent.ExecutionException;

@Service
public class ExamResultService {
    private final List<ExamResult> results = new ArrayList<>(); // demo: lưu tạm bộ nhớ

    @Autowired
    private PartService partService;

    public List<ExamResult> getAllResults() {
        return results;
    }

    public List<ExamResult> getAllResultsFromFirebase() throws ExecutionException, InterruptedException {
        List<ExamResult> firebaseResults = new ArrayList<>();
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection("exam_results").get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            
            for (QueryDocumentSnapshot doc : documents) {
                ExamResult result = new ExamResult();
                result.setId(doc.getId());
                result.setUserName(doc.getString("userName"));
                result.setUserEmail(doc.getString("userEmail"));
                result.setUserStudentId(doc.getString("userStudentId"));
                result.setTestName(doc.getString("testName"));
                result.setTestId(doc.getString("testId"));
                result.setScore(doc.getDouble("score") != null ? doc.getDouble("score") : 0.0);
                result.setSubmittedAt(doc.getString("submittedAt"));
                result.setStatus(doc.getString("status"));
                result.setLeaveScreenCount(doc.getLong("leaveScreenCount") != null ? doc.getLong("leaveScreenCount").intValue() : 0);
                
                // Xử lý details
                List<Map<String, Object>> detailsData = (List<Map<String, Object>>) doc.get("details");
                if (detailsData != null) {
                    List<ExamResult.Detail> details = new ArrayList<>();
                    for (Map<String, Object> detailData : detailsData) {
                        ExamResult.Detail detail = new ExamResult.Detail();
                        detail.setQuestionId((String) detailData.get("questionId"));
                        detail.setQuestion((String) detailData.get("question"));
                        detail.setAnswer((String) detailData.get("answer"));
                        detail.setOptionIds((String) detailData.get("optionIds"));
                        detail.setCorrect((Boolean) detailData.get("correct"));
                        detail.setPoint(detailData.get("point") != null ? ((Number) detailData.get("point")).doubleValue() : 0.0);
                        details.add(detail);
                    }
                    result.setDetails(details);
                }
                
                firebaseResults.add(result);
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Lỗi khi lấy dữ liệu từ Firebase: " + e.getMessage());
            // Fallback về dữ liệu trong memory nếu không lấy được từ Firebase
            return results;
        }
        
        return firebaseResults;
    }

    /**
     * Lấy số lượt thi đã sử dụng của user cho một bài thi
     */
    public int getAttemptCountByUserId(String userId, String testId) throws ExecutionException, InterruptedException {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection("exam_results")
                .whereEqualTo("userId", userId)
                .whereEqualTo("testId", testId)
                .get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            return documents.size();
        } catch (Exception e) {
            System.err.println("[ERROR] Lỗi khi đếm số lượt thi: " + e.getMessage());
            return 0;
        }
    }

    /**
     * Kiểm tra xem user có thể thi bài thi này không
     */
    public boolean canTakeTestByUserId(String userId, String testId, int maxRetake) throws ExecutionException, InterruptedException {
        int attemptCount = getAttemptCountByUserId(userId, testId);
        return attemptCount < maxRetake;
    }

    public void saveResult(ExamResult result) {
        try {
            Part part = partService.getPartById(result.getTestName());
            if (part == null || part.getQuestions() == null || result.getDetails() == null) {
                results.add(result);
                return;
            }
            // Map<questionId, Detail> để tra cứu nhanh
            java.util.Map<String, ExamResult.Detail> submittedDetailsMap = result.getDetails().stream()
                .collect(java.util.stream.Collectors.toMap(ExamResult.Detail::getQuestionId, java.util.function.Function.identity()));
            double totalScore = 0;
            for (Part.QuestionInTest question : part.getQuestions()) {
                ExamResult.Detail submittedDetail = submittedDetailsMap.get(question.getId());
                if (submittedDetail == null) continue;
                java.util.Set<String> correctOptionIds = new java.util.HashSet<>();
                if (question.getOptions() != null) {
                    for (com.yourcompany.onlineexam.model.Question.Option opt : question.getOptions()) {
                        if (opt.isCorrect()) correctOptionIds.add(opt.getId());
                    }
                }
                java.util.Set<String> userOptionIds = new java.util.HashSet<>();
                if (submittedDetail.getOptionIds() != null && !submittedDetail.getOptionIds().isEmpty()) {
                    String[] arr = submittedDetail.getOptionIds().split(",");
                    for (String s : arr) userOptionIds.add(s.trim());
                }
                boolean isCorrect = false;
                String type = question.getType() != null ? question.getType().toLowerCase() : "";
                if ("multiple".equals(type)) {
                    isCorrect = correctOptionIds.equals(userOptionIds);
                } else if ("single".equals(type) || "truefalse".equals(type)) {
                    isCorrect = correctOptionIds.size() == 1 && userOptionIds.size() == 1 && correctOptionIds.iterator().next().equals(userOptionIds.iterator().next());
                }
                submittedDetail.setCorrect(isCorrect);
                double point = isCorrect ? (question.getScore() > 0 ? question.getScore() : 1.0) : 0;
                submittedDetail.setPoint(point);
                if (isCorrect) totalScore += point;
            }
            // Làm tròn thông thường 1 chữ số thập phân
            double roundedScore = Math.round(totalScore * 10.0) / 10.0;
            result.setScore(roundedScore);
            Firestore db = FirestoreClient.getFirestore();
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("userName", result.getUserName());
            data.put("userEmail", result.getUserEmail());
            data.put("userStudentId", result.getUserStudentId());
            data.put("testName", result.getTestName());
            data.put("testId", result.getTestId());
            data.put("score", result.getScore());
            data.put("submittedAt", result.getSubmittedAt());
            data.put("status", result.getStatus());
            data.put("details", result.getDetails());
            data.put("leaveScreenCount", result.getLeaveScreenCount());
            data.put("userId", result.getUserId());
            db.collection("exam_results").add(data);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("[ERROR] Lỗi khi lưu kết quả thi: " + e.getMessage());
            throw new RuntimeException("Lỗi khi lưu kết quả thi", e);
        }
        results.add(result);
    }

    /**
     * Tính toán điểm và lưu kết quả bài thi
     * @param result Kết quả bài thi từ user
     * @return Kết quả đã được tính điểm
     */
    public ExamResult calculateAndSaveResult(ExamResult result) {
        try {
            System.out.println("[DEBUG] Bắt đầu xử lý nộp bài thi cho user: " + result.getUserName());
            System.out.println("[DEBUG] TestId: " + result.getTestId() + ", TestName: " + result.getTestName());
            
            // Lấy thông tin đề thi từ Firebase
            String partId = result.getTestId() != null ? result.getTestId() : result.getTestName();
            System.out.println("[DEBUG] Sử dụng partId: " + partId);
            
            Part part = null;
            try {
                part = partService.getPartById(partId);
                System.out.println("[DEBUG] Đã lấy được part: " + (part != null ? part.getName() : "null"));
            } catch (Exception e) {
                System.err.println("[ERROR] Lỗi khi lấy đề thi từ Firebase: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Không thể lấy thông tin đề thi từ database: " + e.getMessage());
            }
            
            if (part == null) {
                throw new RuntimeException("Không tìm thấy đề thi với ID: " + partId);
            }

            if (result.getDetails() == null || result.getDetails().isEmpty()) {
                throw new RuntimeException("Không có câu trả lời nào được gửi");
            }
            
            System.out.println("[DEBUG] Số câu trả lời được gửi: " + result.getDetails().size());
            System.out.println("[DEBUG] Số câu hỏi trong đề thi: " + (part.getQuestions() != null ? part.getQuestions().size() : 0));

            // Tạo map để tra cứu nhanh các câu trả lời của user
            java.util.Map<String, ExamResult.Detail> submittedDetailsMap = result.getDetails().stream()
                .filter(detail -> detail.getQuestionId() != null) // Lọc bỏ những detail có questionId null
                .collect(Collectors.toMap(ExamResult.Detail::getQuestionId, detail -> detail));

            double totalScore = 0.0;
            int totalQuestions = part.getQuestions() != null ? part.getQuestions().size() : 0;
            int answeredQuestions = 0;

            // Tính điểm cho từng câu hỏi
            if (part.getQuestions() != null) {
                for (Part.QuestionInTest question : part.getQuestions()) {
                    ExamResult.Detail submittedDetail = submittedDetailsMap.get(question.getId());
                    
                    if (submittedDetail == null) {
                        // User không trả lời câu này
                        submittedDetail = new ExamResult.Detail();
                        submittedDetail.setQuestionId(question.getId() != null ? question.getId() : "unknown_" + System.currentTimeMillis());
                        submittedDetail.setQuestion(question.getContent() != null ? question.getContent() : "Câu hỏi không có nội dung");
                        submittedDetail.setOptionIds("");
                        submittedDetail.setCorrect(false);
                        submittedDetail.setPoint(0.0);
                        submittedDetail.setAnswer("Không trả lời");
                        result.getDetails().add(submittedDetail);
                        continue;
                    }

                    answeredQuestions++;
                    
                    // Đảm bảo options có ID
                    ensureOptionsHaveIds(question);
                    
                    System.out.println("[DEBUG] Xử lý câu hỏi: " + question.getId() + " - " + question.getContent());
                    
                    // Lấy đáp án đúng từ đề thi
                    Set<String> correctOptionIds = new HashSet<>();
                    if (question.getOptions() != null) {
                        for (com.yourcompany.onlineexam.model.Question.Option opt : question.getOptions()) {
                            if (opt.isCorrect()) {
                                correctOptionIds.add(opt.getId());
                            }
                        }
                    }

                    // Lấy đáp án của user
                    Set<String> userOptionIds = new HashSet<>();
                    if (submittedDetail.getOptionIds() != null && !submittedDetail.getOptionIds().isEmpty()) {
                        String[] optionIds = submittedDetail.getOptionIds().split(",");
                        for (String id : optionIds) {
                            userOptionIds.add(id.trim());
                        }
                    }

                    // Kiểm tra đúng sai dựa trên loại câu hỏi
                    boolean isCorrect = checkAnswerCorrect(question.getType(), correctOptionIds, userOptionIds);
                    
                    // Tính điểm cho câu hỏi
                    double questionScore = calculateQuestionScore(question, isCorrect, correctOptionIds, userOptionIds);
                    
                    // Tạo chuỗi đáp án để hiển thị
                    String answerText = createAnswerText(question, userOptionIds);
                    
                    // Cập nhật thông tin chi tiết
                    submittedDetail.setCorrect(isCorrect);
                    submittedDetail.setPoint(questionScore);
                    submittedDetail.setQuestion(question.getContent() != null ? question.getContent() : "Câu hỏi không có nội dung");
                    submittedDetail.setAnswer(answerText);
                    
                    totalScore += questionScore;
                }
            }

            // Cập nhật tổng điểm
            // Làm tròn thông thường 1 chữ số thập phân
            double roundedScore = Math.round(totalScore * 10.0) / 10.0;
            result.setScore(roundedScore);
            
            // Lưu vào Firebase
            try {
                Firestore db = FirestoreClient.getFirestore();
                // Thêm thông tin bổ sung cho Firebase
                java.util.Map<String, Object> firebaseData = new java.util.HashMap<>();
                firebaseData.put("userName", result.getUserName() != null ? result.getUserName() : "Unknown");
                firebaseData.put("userEmail", result.getUserEmail());
                firebaseData.put("userStudentId", result.getUserStudentId());
                firebaseData.put("testName", result.getTestName() != null ? result.getTestName() : "Unknown");
                firebaseData.put("testId", result.getTestId());
                firebaseData.put("score", result.getScore());
                firebaseData.put("submittedAt", result.getSubmittedAt() != null ? result.getSubmittedAt() : new java.util.Date().toString());
                firebaseData.put("status", result.getStatus() != null ? result.getStatus() : "submitted");
                firebaseData.put("details", result.getDetails());
                firebaseData.put("leaveScreenCount", result.getLeaveScreenCount());
                firebaseData.put("totalQuestions", totalQuestions);
                firebaseData.put("answeredQuestions", answeredQuestions);
                firebaseData.put("correctAnswers", result.getDetails().stream().filter(d -> d.isCorrect()).count());
                firebaseData.put("userId", result.getUserId());
                
                db.collection("exam_results").add(firebaseData);
                System.out.println("[INFO] Đã lưu kết quả vào Firebase thành công");
            } catch (Exception e) {
                System.err.println("[WARNING] Không thể lưu vào Firebase: " + e.getMessage());
                e.printStackTrace();
                // Vẫn tiếp tục xử lý nếu không lưu được Firebase
            }

            // Lưu vào memory cache
            results.add(result);

            System.out.println(String.format("[INFO] Đã tính xong điểm cho user %s: %.2f/%.2f (trả lời %d/%d câu)", 
                result.getUserName(), totalScore, part.getScore(), answeredQuestions, totalQuestions));

            return result;

        } catch (Exception e) {
            System.err.println("[ERROR] Lỗi khi tính toán điểm: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Lỗi khi tính toán điểm bài thi: " + e.getMessage(), e);
        }
    }

    /**
     * Đảm bảo tất cả options có ID
     */
    private void ensureOptionsHaveIds(Part.QuestionInTest question) {
        if (question.getOptions() != null) {
            for (int i = 0; i < question.getOptions().size(); i++) {
                com.yourcompany.onlineexam.model.Question.Option option = question.getOptions().get(i);
                if (option.getId() == null || option.getId().isEmpty()) {
                    // Tạo ID dựa trên index nếu chưa có
                    option.setId("opt_" + i);
                }
            }
        }
    }

    /**
     * Kiểm tra câu trả lời có đúng không dựa trên loại câu hỏi
     */
    private boolean checkAnswerCorrect(String questionType, Set<String> correctOptionIds, Set<String> userOptionIds) {
        if (questionType == null) {
            questionType = "single"; // Mặc định là câu hỏi đơn
        }

        // Kiểm tra null safety
        if (correctOptionIds == null || userOptionIds == null) {
            return false;
        }

        switch (questionType.toLowerCase()) {
            case "multiple":
            case "multiple_choice":
                // Câu hỏi nhiều lựa chọn: phải chọn đúng tất cả đáp án đúng và không chọn đáp án sai
                return correctOptionIds.equals(userOptionIds);
                
            case "single":
            case "single_choice":
                // Câu hỏi một lựa chọn: chỉ chọn 1 đáp án đúng
                return correctOptionIds.size() == 1 && userOptionIds.size() == 1 
                    && correctOptionIds.iterator().next().equals(userOptionIds.iterator().next());
                
            case "truefalse":
            case "true_false":
                // Câu hỏi đúng/sai: chỉ chọn 1 đáp án đúng
                return correctOptionIds.size() == 1 && userOptionIds.size() == 1 
                    && correctOptionIds.iterator().next().equals(userOptionIds.iterator().next());
                
            default:
                // Mặc định xử lý như câu hỏi đơn
                return correctOptionIds.size() == 1 && userOptionIds.size() == 1 
                    && correctOptionIds.iterator().next().equals(userOptionIds.iterator().next());
        }
    }

    /**
     * Tính điểm cho từng câu hỏi
     */
    private double calculateQuestionScore(Part.QuestionInTest question, boolean isCorrect, 
                                        Set<String> correctOptionIds, Set<String> userOptionIds) {
        if (!isCorrect) {
            return 0.0; // Không đúng thì 0 điểm
        }

        // Lấy điểm của câu hỏi
        double questionScore = question.getScore() != null ? question.getScore() : 1.0;
        
        // Nếu là câu hỏi nhiều lựa chọn, có thể tính điểm theo tỷ lệ đúng
        if ("multiple".equals(question.getType()) || "multiple_choice".equals(question.getType())) {
            // Tính tỷ lệ đáp án đúng được chọn
            int correctSelected = 0;
            int incorrectSelected = 0;
            
            for (String userOptionId : userOptionIds) {
                if (correctOptionIds.contains(userOptionId)) {
                    correctSelected++;
                } else {
                    incorrectSelected++;
                }
            }
            
            // Nếu chọn đáp án sai thì trừ điểm
            if (incorrectSelected > 0) {
                double penalty = (double) incorrectSelected / correctOptionIds.size();
                questionScore = Math.max(0, questionScore * (1 - penalty));
            }
        }
        
        return Math.round(questionScore * 100.0) / 100.0; // Làm tròn 2 chữ số thập phân
    }

    /**
     * Tạo chuỗi đáp án để hiển thị
     */
    private String createAnswerText(Part.QuestionInTest question, Set<String> userOptionIds) {
        if (userOptionIds.isEmpty()) {
            return "Không trả lời";
        }

        StringBuilder answerText = new StringBuilder();
        if (question.getOptions() != null) {
            for (int i = 0; i < question.getOptions().size(); i++) {
                com.yourcompany.onlineexam.model.Question.Option option = question.getOptions().get(i);
                if (option != null && option.getId() != null && userOptionIds.contains(option.getId())) {
                    if (answerText.length() > 0) {
                        answerText.append(", ");
                    }
                    String optionText = option.getText() != null ? option.getText() : "Option " + (i + 1);
                    answerText.append(String.valueOf((char)('A' + i))).append(". ").append(optionText);
                }
            }
        }

        return answerText.length() > 0 ? answerText.toString() : "Không trả lời";
    }
}