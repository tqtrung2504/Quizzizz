package com.yourcompany.onlineexam.service;

import com.yourcompany.onlineexam.model.Part;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class ExamTimeService {
    private static final String PARTS_COLLECTION = "parts";
    private static final String EXAM_RESULTS_COLLECTION = "examResults";

    /**
     * Lấy thông tin thời gian hiện tại
     */
    public Map<String, Object> getCurrentTimeInfo() {
        Date now = new Date();
        Map<String, Object> timeInfo = new HashMap<>();
        timeInfo.put("currentTime", now);
        timeInfo.put("timestamp", now.getTime());
        timeInfo.put("formattedTime", formatDateTime(now));
        return timeInfo;
    }

    /**
     * Kiểm tra trạng thái bài thi theo thời gian
     */
    public Map<String, Object> getTimeStatus(String partId) throws ExecutionException, InterruptedException {
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
            status.put("timeStatus", "NO_TIME_LIMIT");
            status.put("status", "AVAILABLE");
            status.put("message", "Bài thi không có giới hạn thời gian");
            status.put("canStart", true);
        } else if (now.before(openTime)) {
            status.put("timeStatus", "NOT_OPENED");
            status.put("status", "WAITING");
            status.put("message", "Chưa đến thời gian mở đề thi");
            status.put("canStart", false);
            status.put("timeUntilOpen", openTime.getTime() - now.getTime());
            status.put("formattedTimeUntilOpen", formatTimeRemaining(openTime.getTime() - now.getTime()));
        } else if (now.after(closeTime)) {
            status.put("timeStatus", "CLOSED");
            status.put("status", "EXPIRED");
            status.put("message", "Đã quá thời gian dự thi");
            status.put("canStart", false);
        } else {
            status.put("timeStatus", "OPEN");
            status.put("status", "AVAILABLE");
            status.put("message", "Có thể bắt đầu làm bài");
            status.put("canStart", true);
            status.put("timeRemaining", closeTime.getTime() - now.getTime());
            status.put("formattedTimeRemaining", formatTimeRemaining(closeTime.getTime() - now.getTime()));
        }
        
        return status;
    }

    /**
     * Lấy thông tin đếm ngược thời gian
     */
    public Map<String, Object> getCountdown(String partId) throws ExecutionException, InterruptedException {
        Map<String, Object> timeStatus = getTimeStatus(partId);
        String timeStatusStr = (String) timeStatus.get("timeStatus");
        
        Map<String, Object> countdown = new HashMap<>();
        countdown.put("partId", partId);
        countdown.put("timeStatus", timeStatusStr);
        
        switch (timeStatusStr) {
            case "NOT_OPENED":
                Long timeUntilOpen = (Long) timeStatus.get("timeUntilOpen");
                countdown.put("targetTime", timeStatus.get("openTime"));
                countdown.put("remainingTime", timeUntilOpen);
                countdown.put("formattedRemaining", timeStatus.get("formattedTimeUntilOpen"));
                countdown.put("message", "Thời gian còn lại đến khi mở đề thi");
                break;
                
            case "OPEN":
                Long timeRemaining = (Long) timeStatus.get("timeRemaining");
                countdown.put("targetTime", timeStatus.get("closeTime"));
                countdown.put("remainingTime", timeRemaining);
                countdown.put("formattedRemaining", timeStatus.get("formattedTimeRemaining"));
                countdown.put("message", "Thời gian còn lại để làm bài");
                break;
                
            case "CLOSED":
                countdown.put("remainingTime", 0L);
                countdown.put("formattedRemaining", "00:00:00");
                countdown.put("message", "Đã hết thời gian làm bài");
                break;
                
            default:
                countdown.put("remainingTime", null);
                countdown.put("formattedRemaining", "N/A");
                countdown.put("message", "Không có giới hạn thời gian");
                break;
        }
        
        return countdown;
    }

    /**
     * Kiểm tra xem có thể làm bài hay không
     */
    public Map<String, Object> canTakeExam(String partId, String userEmail) throws ExecutionException, InterruptedException {
        Map<String, Object> timeStatus = getTimeStatus(partId);
        boolean canStartByTime = (Boolean) timeStatus.get("canStart");
        
        Map<String, Object> result = new HashMap<>();
        result.put("partId", partId);
        result.put("canTakeByTime", canStartByTime);
        result.put("timeStatus", timeStatus);
        
        if (!canStartByTime) {
            result.put("canTake", false);
            result.put("reason", timeStatus.get("message"));
            return result;
        }
        
        // Kiểm tra số lần làm bài
        Part part = getPartById(partId);
        Integer maxRetake = part.getMaxRetake();
        if (maxRetake != null && maxRetake > 0) {
            int currentAttempts = getCurrentAttempts(partId, userEmail);
            if (currentAttempts >= maxRetake) {
                result.put("canTake", false);
                result.put("reason", "Bạn đã hết số lần làm bài cho phép!");
                result.put("currentAttempts", currentAttempts);
                result.put("maxRetake", maxRetake);
                return result;
            }
            result.put("currentAttempts", currentAttempts);
            result.put("maxRetake", maxRetake);
        }
        
        result.put("canTake", true);
        result.put("reason", "Có thể làm bài");
        
        return result;
    }

    /**
     * Lấy danh sách bài thi theo trạng thái thời gian
     */
    public Map<String, Object> getExamsByTimeStatus(String status, String courseId) throws ExecutionException, InterruptedException {
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
        List<Map<String, Object>> waitingExams = new ArrayList<>();
        List<Map<String, Object>> expiredExams = new ArrayList<>();
        List<Map<String, Object>> noTimeLimitExams = new ArrayList<>();
        
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
            
            // Phân loại theo trạng thái thời gian
            if (part.getOpenTime() == null || part.getCloseTime() == null) {
                examInfo.put("timeStatus", "NO_TIME_LIMIT");
                examInfo.put("status", "AVAILABLE");
                noTimeLimitExams.add(examInfo);
            } else if (now.before(part.getOpenTime())) {
                examInfo.put("timeStatus", "NOT_OPENED");
                examInfo.put("status", "WAITING");
                examInfo.put("timeUntilOpen", part.getOpenTime().getTime() - now.getTime());
                examInfo.put("formattedTimeUntilOpen", formatTimeRemaining(part.getOpenTime().getTime() - now.getTime()));
                waitingExams.add(examInfo);
            } else if (now.after(part.getCloseTime())) {
                examInfo.put("timeStatus", "CLOSED");
                examInfo.put("status", "EXPIRED");
                expiredExams.add(examInfo);
            } else {
                examInfo.put("timeStatus", "OPEN");
                examInfo.put("status", "AVAILABLE");
                examInfo.put("timeRemaining", part.getCloseTime().getTime() - now.getTime());
                examInfo.put("formattedTimeRemaining", formatTimeRemaining(part.getCloseTime().getTime() - now.getTime()));
                availableExams.add(examInfo);
            }
        }
        
        // Lọc theo status nếu được chỉ định
        if (status != null && !status.trim().isEmpty()) {
            switch (status.toUpperCase()) {
                case "AVAILABLE":
                    availableExams.addAll(noTimeLimitExams);
                    break;
                case "WAITING":
                    return Map.of("exams", waitingExams, "currentTime", now);
                case "EXPIRED":
                    return Map.of("exams", expiredExams, "currentTime", now);
                case "NO_TIME_LIMIT":
                    return Map.of("exams", noTimeLimitExams, "currentTime", now);
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("availableExams", availableExams);
        result.put("waitingExams", waitingExams);
        result.put("expiredExams", expiredExams);
        result.put("noTimeLimitExams", noTimeLimitExams);
        result.put("currentTime", now);
        
        return result;
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

    private String formatDateTime(Date date) {
        if (date == null) return "N/A";
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTime(date);
        return String.format("%02d/%02d/%04d %02d:%02d:%02d",
            cal.get(java.util.Calendar.DAY_OF_MONTH), 
            cal.get(java.util.Calendar.MONTH) + 1, 
            cal.get(java.util.Calendar.YEAR),
            cal.get(java.util.Calendar.HOUR_OF_DAY), 
            cal.get(java.util.Calendar.MINUTE), 
            cal.get(java.util.Calendar.SECOND));
    }

    private String formatTimeRemaining(long milliseconds) {
        if (milliseconds <= 0) return "00:00:00";
        
        long seconds = milliseconds / 1000;
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        
        return String.format("%02d:%02d:%02d", hours, minutes, secs);
    }
} 