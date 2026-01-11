package com.yourcompany.onlineexam.service;

import com.yourcompany.onlineexam.model.Part;
import com.yourcompany.onlineexam.model.ExamResult;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class ExamSessionService {
    private static final String PARTS_COLLECTION = "parts";
    private static final String EXAM_RESULTS_COLLECTION = "examResults";
    private static final String EXAM_SESSIONS_COLLECTION = "examSessions";

    /**
     * Kiểm tra trạng thái bài thi
     */
    public Map<String, Object> getExamStatus(String partId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(PARTS_COLLECTION).document(partId);
        DocumentSnapshot doc = docRef.get().get();
        
        if (!doc.exists()) {
            throw new IllegalArgumentException("Bài thi không tồn tại!");
        }

        Part part = doc.toObject(Part.class);
        if (part == null) {
            throw new IllegalArgumentException("Không thể đọc dữ liệu bài thi!");
        }
        part.setId(doc.getId());
        
        Date now = new Date();
        Date openTime = part.getOpenTime();
        Date closeTime = part.getCloseTime();
        
        Map<String, Object> status = new HashMap<>();
        status.put("partId", partId);
        status.put("partName", part.getName());
        status.put("currentTime", now);
        status.put("openTime", openTime);
        status.put("closeTime", closeTime);
        status.put("duration", part.getDuration());
        
        if (openTime == null || closeTime == null) {
            status.put("status", "NO_TIME_LIMIT");
            status.put("message", "Bài thi không có giới hạn thời gian");
            status.put("canStart", true);
        } else if (now.before(openTime)) {
            status.put("status", "NOT_OPENED");
            status.put("message", "Chưa đến thời gian mở đề thi");
            status.put("canStart", false);
            status.put("timeUntilOpen", openTime.getTime() - now.getTime());
        } else if (now.after(closeTime)) {
            status.put("status", "CLOSED");
            status.put("message", "Đã quá thời gian dự thi");
            status.put("canStart", false);
        } else {
            status.put("status", "AVAILABLE");
            status.put("message", "Có thể bắt đầu làm bài");
            status.put("canStart", true);
            status.put("timeRemaining", closeTime.getTime() - now.getTime());
        }
        
        return status;
    }

    /**
     * Bắt đầu làm bài thi
     */
    public Map<String, Object> startExam(String partId, String userEmail) throws ExecutionException, InterruptedException {
        // Kiểm tra trạng thái bài thi
        Map<String, Object> status = getExamStatus(partId);
        if (!(Boolean) status.get("canStart")) {
            throw new IllegalArgumentException((String) status.get("message"));
        }

        // Kiểm tra số lần làm bài
        Part part = getPartById(partId);
        Integer maxRetake = part.getMaxRetake();
        if (maxRetake != null && maxRetake > 0) {
            int currentAttempts = getCurrentAttempts(partId, userEmail);
            if (currentAttempts >= maxRetake) {
                throw new IllegalArgumentException("Bạn đã hết số lần làm bài cho phép!");
            }
        }

        // Tạo session làm bài
        Firestore db = FirestoreClient.getFirestore();
        Map<String, Object> session = new HashMap<>();
        session.put("partId", partId);
        session.put("userEmail", userEmail);
        session.put("startTime", new Date());
        session.put("status", "IN_PROGRESS");
        
        ApiFuture<DocumentReference> future = db.collection(EXAM_SESSIONS_COLLECTION).add(session);
        String sessionId = future.get().getId();
        
        // Chuẩn bị bài thi cho sinh viên
        Map<String, Object> examData = prepareExamForStudent(part);
        
        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("examData", examData);
        result.put("startTime", session.get("startTime"));
        result.put("duration", part.getDuration());
        result.put("maxRetake", part.getMaxRetake());
        
        return result;
    }

    /**
     * Lấy danh sách bài thi có thể làm
     */
    public Map<String, Object> getAvailableExams(String userEmail, String courseId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference partsRef = db.collection(PARTS_COLLECTION);
        
        Query query;
        if (courseId != null && !courseId.trim().isEmpty()) {
            query = partsRef.whereEqualTo("courseId", courseId);
        } else {
            query = partsRef;
        }
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        Date now = new Date();
        List<Map<String, Object>> availableExams = new ArrayList<>();
        List<Map<String, Object>> upcomingExams = new ArrayList<>();
        List<Map<String, Object>> closedExams = new ArrayList<>();
        
        for (QueryDocumentSnapshot doc : documents) {
            Part part = doc.toObject(Part.class);
            part.setId(doc.getId());
            
            Map<String, Object> examInfo = new HashMap<>();
            examInfo.put("partId", part.getId());
            examInfo.put("partName", part.getName());
            examInfo.put("description", part.getDescription());
            examInfo.put("duration", part.getDuration());
            examInfo.put("score", part.getScore());
            examInfo.put("openTime", part.getOpenTime());
            examInfo.put("closeTime", part.getCloseTime());
            examInfo.put("maxRetake", part.getMaxRetake());
            
            // Kiểm tra trạng thái thời gian
            if (part.getOpenTime() == null || part.getCloseTime() == null) {
                examInfo.put("status", "NO_TIME_LIMIT");
                availableExams.add(examInfo);
            } else if (now.before(part.getOpenTime())) {
                examInfo.put("status", "NOT_OPENED");
                examInfo.put("timeUntilOpen", part.getOpenTime().getTime() - now.getTime());
                upcomingExams.add(examInfo);
            } else if (now.after(part.getCloseTime())) {
                examInfo.put("status", "CLOSED");
                closedExams.add(examInfo);
            } else {
                examInfo.put("status", "AVAILABLE");
                examInfo.put("timeRemaining", part.getCloseTime().getTime() - now.getTime());
                availableExams.add(examInfo);
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("availableExams", availableExams);
        result.put("upcomingExams", upcomingExams);
        result.put("closedExams", closedExams);
        result.put("currentTime", now);
        
        return result;
    }

    /**
     * Kiểm tra thời gian còn lại
     */
    public Map<String, Object> getRemainingTime(String partId, String userEmail) throws ExecutionException, InterruptedException {
        // Kiểm tra session hiện tại
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference sessionsRef = db.collection(EXAM_SESSIONS_COLLECTION);
        Query query = sessionsRef.whereEqualTo("partId", partId)
                               .whereEqualTo("userEmail", userEmail)
                               .whereEqualTo("status", "IN_PROGRESS");
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        if (documents.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy phiên làm bài đang diễn ra!");
        }
        
        DocumentSnapshot sessionDoc = documents.get(0);
        Date startTime = sessionDoc.getDate("startTime");
        if (startTime == null) {
            throw new IllegalArgumentException("Không tìm thấy thời gian bắt đầu phiên làm bài!");
        }
        Part part = getPartById(partId);
        
        Date now = new Date();
        long elapsedTime = now.getTime() - startTime.getTime();
        long totalDuration = part.getDuration() * 60 * 1000L; // Chuyển phút thành milliseconds
        long remainingTime = totalDuration - elapsedTime;
        
        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", sessionDoc.getId());
        result.put("startTime", startTime);
        result.put("elapsedTime", elapsedTime);
        result.put("totalDuration", totalDuration);
        result.put("remainingTime", Math.max(0, remainingTime));
        result.put("isTimeUp", remainingTime <= 0);
        
        return result;
    }

    /**
     * Nộp bài thi
     */
    public Map<String, Object> submitExam(String partId, String userEmail, Map<String, Object> answers) throws ExecutionException, InterruptedException {
        // Kiểm tra session
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference sessionsRef = db.collection(EXAM_SESSIONS_COLLECTION);
        Query query = sessionsRef.whereEqualTo("partId", partId)
                               .whereEqualTo("userEmail", userEmail)
                               .whereEqualTo("status", "IN_PROGRESS");
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        if (documents.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy phiên làm bài đang diễn ra!");
        }
        
        DocumentSnapshot sessionDoc = documents.get(0);
        String sessionId = sessionDoc.getId();
        
        // Cập nhật trạng thái session
        db.collection(EXAM_SESSIONS_COLLECTION).document(sessionId)
          .update("status", "COMPLETED", "endTime", new Date());
        
        // Tính điểm và lưu kết quả
        Part part = getPartById(partId);
        Map<String, Object> result = calculateScore(part, answers);
        
        // Lưu kết quả bài thi
        ExamResult examResult = new ExamResult();
        examResult.setTestId(partId);
        examResult.setUserEmail(userEmail);
        examResult.setScore((Double) result.get("score"));
        examResult.setTestName(part.getName());
        examResult.setSubmittedAt(new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new Date()));
        examResult.setStatus("submitted");
        examResult.setDetails((List<ExamResult.Detail>) result.get("details"));
        
        ApiFuture<DocumentReference> resultFuture = db.collection(EXAM_RESULTS_COLLECTION).add(examResult);
        String resultId = resultFuture.get().getId();
        
        Map<String, Object> response = new HashMap<>();
        response.put("resultId", resultId);
        response.put("score", result.get("score"));
        response.put("totalScore", result.get("totalScore"));
        response.put("correctAnswers", result.get("correctAnswers"));
        response.put("totalQuestions", result.get("totalQuestions"));
        response.put("showAnswerAfterSubmit", part.getShowAnswerAfterSubmit());
        
        if (part.getShowAnswerAfterSubmit()) {
            response.put("details", result.get("details"));
        }
        
        return response;
    }

    // Helper methods
    private Part getPartById(String partId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(PARTS_COLLECTION).document(partId);
        DocumentSnapshot doc = docRef.get().get();
        
        if (!doc.exists()) {
            throw new IllegalArgumentException("Bài thi không tồn tại!");
        }
        
        Part part = doc.toObject(Part.class);
        if (part == null) {
            throw new IllegalArgumentException("Không thể đọc dữ liệu bài thi!");
        }
        part.setId(doc.getId());
        return part;
    }

    private int getCurrentAttempts(String partId, String userEmail) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference resultsRef = db.collection(EXAM_RESULTS_COLLECTION);
        Query query = resultsRef.whereEqualTo("partId", partId)
                              .whereEqualTo("userEmail", userEmail);
        
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        return documents.size();
    }

    private Map<String, Object> prepareExamForStudent(Part part) {
        Map<String, Object> examData = new HashMap<>();
        examData.put("partId", part.getId());
        examData.put("partName", part.getName());
        examData.put("description", part.getDescription());
        examData.put("duration", part.getDuration());
        examData.put("score", part.getScore());
        
        // Xử lý câu hỏi
        List<Map<String, Object>> questions = new ArrayList<>();
        if (part.getQuestions() != null) {
            List<Part.QuestionInTest> questionList = new ArrayList<>(part.getQuestions());
            
            // Random câu hỏi nếu được bật
            if (part.getRandomizeQuestions() != null && part.getRandomizeQuestions()) {
                Collections.shuffle(questionList);
            }
            
            for (Part.QuestionInTest q : questionList) {
                Map<String, Object> questionData = new HashMap<>();
                questionData.put("id", q.getId());
                questionData.put("content", q.getContent());
                questionData.put("type", q.getType());
                questionData.put("level", q.getLevel());
                questionData.put("score", q.getScore());
                questionData.put("options", q.getOptions());
                
                // Không gửi đáp án đúng cho sinh viên
                questionData.put("answer", null);
                questionData.put("correctAnswers", null);
                
                questions.add(questionData);
            }
        }
        
        examData.put("questions", questions);
        return examData;
    }

    private Map<String, Object> calculateScore(Part part, Map<String, Object> answers) {
        double totalScore = 0;
        double earnedScore = 0;
        int correctAnswers = 0;
        int totalQuestions = 0;
        List<ExamResult.Detail> details = new ArrayList<>();
        
        if (part.getQuestions() != null) {
            for (Part.QuestionInTest question : part.getQuestions()) {
                totalQuestions++;
                totalScore += question.getScore();
                
                String questionId = question.getId();
                Object userAnswer = answers.get(questionId);
                
                boolean isCorrect = false;
                if (userAnswer != null) {
                    if ("single_choice".equals(question.getType())) {
                        isCorrect = question.getAnswer().equals(String.valueOf(userAnswer));
                    } else if ("multiple_choice".equals(question.getType())) {
                        List<Integer> userAnswers = (List<Integer>) userAnswer;
                        List<Integer> correctAnswerList = question.getCorrectAnswers();
                        isCorrect = userAnswers != null && correctAnswerList != null &&
                                  userAnswers.size() == correctAnswerList.size() &&
                                  userAnswers.containsAll(correctAnswerList);
                    }
                }
                
                if (isCorrect) {
                    earnedScore += question.getScore();
                    correctAnswers++;
                }
                
                // Tạo chi tiết kết quả
                ExamResult.Detail detail = new ExamResult.Detail();
                detail.setQuestionId(questionId);
                detail.setQuestion(question.getContent());
                detail.setAnswer(String.valueOf(userAnswer));
                detail.setCorrect(isCorrect);
                detail.setPoint(isCorrect ? question.getScore() : 0.0);
                details.add(detail);
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("score", earnedScore);
        result.put("totalScore", totalScore);
        result.put("correctAnswers", correctAnswers);
        result.put("totalQuestions", totalQuestions);
        result.put("details", details);
        
        return result;
    }
} 