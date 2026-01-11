package com.yourcompany.onlineexam.service;

import com.yourcompany.onlineexam.model.Part;
import com.yourcompany.onlineexam.model.Question;
import com.yourcompany.onlineexam.model.Course;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class PartService {
    private static final String COLLECTION_NAME = "parts";
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private CourseService courseService;

    public List<Part> getAllParts() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Part> parts = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Part part = doc.toObject(Part.class);
            part.setId(doc.getId());
            if (part.getQuestions() != null) {
                for (Part.QuestionInTest q : part.getQuestions()) {
                    if (q.getOptions() != null) {
                        List<Integer> correctIdxs = new ArrayList<>();
                        int idx = 0;
                        for (Question.Option opt : q.getOptions()) {
                            if (opt.isCorrect()) correctIdxs.add(idx);
                            idx++;
                        }
                        if (correctIdxs.size() > 1) {
                            q.setType("multiple_choice");
                            q.setCorrectAnswers(correctIdxs);
                        } else if (correctIdxs.size() == 1) {
                            q.setType("single_choice");
                            q.setAnswer(String.valueOf(correctIdxs.get(0)));
                            q.setCorrectAnswers(null);
                        } else {
                            q.setCorrectAnswers(null);
                            System.out.println("[WARNING] Câu hỏi không có đáp án đúng: " + q.getContent());
                        }
                        System.out.println("[DEBUG] Question: " + q.getContent() + " | options: " + q.getOptions());
                        System.out.println("[DEBUG] Correct answers: " + q.getCorrectAnswers() + " | answer: " + q.getAnswer());
                    }
                }
            }
            parts.add(part);
        }
        return parts;
    }

    public Part getPartById(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(id);
        DocumentSnapshot doc = docRef.get().get();
        if (doc.exists()) {
            Part part = doc.toObject(Part.class);
            part.setId(doc.getId());
            if (part.getQuestions() != null) {
                for (Part.QuestionInTest q : part.getQuestions()) {
                    if (q.getOptions() != null) {
                        List<Integer> correctIdxs = new ArrayList<>();
                        int idx = 0;
                        for (Question.Option opt : q.getOptions()) {
                            if (opt.isCorrect()) correctIdxs.add(idx);
                            idx++;
                        }
                        if (correctIdxs.size() > 1) {
                            q.setType("multiple_choice");
                            q.setCorrectAnswers(correctIdxs);
                        } else if (correctIdxs.size() == 1) {
                            q.setType("single_choice");
                            q.setAnswer(String.valueOf(correctIdxs.get(0)));
                            q.setCorrectAnswers(null);
                        } else {
                            q.setCorrectAnswers(null);
                            System.out.println("[WARNING] Câu hỏi không có đáp án đúng: " + q.getContent());
                        }
                        System.out.println("[DEBUG] Question: " + q.getContent() + " | options: " + q.getOptions());
                        System.out.println("[DEBUG] Correct answers: " + q.getCorrectAnswers() + " | answer: " + q.getAnswer());
                    }
                }
            }
            return part;
        }
        return null;
    }

    public Part createPart(Part part) throws ExecutionException, InterruptedException {
        // Kiểm tra trùng tên trong cùng một môn học
        if (isDuplicateName(part.getName(), part.getCourseId(), null)) {
            throw new IllegalArgumentException("Tên bài thi đã tồn tại trong môn học này!");
        }
        part.setCreatedAt(new Date());
        part.setUpdatedAt(new Date());
        // Đảm bảo trường questions và score được lưu
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION_NAME).add(part);
        String id = future.get().getId();
        part.setId(id);
        db.collection(COLLECTION_NAME).document(id).set(part);
        
        // Push notification cho tất cả students trong course
        try {
            System.out.println("[NOTIFICATION] Bắt đầu push notification cho bài thi mới: " + part.getName());
            pushNotificationForNewExam(part);
        } catch (Exception e) {
            System.err.println("Lỗi khi push notification cho bài thi mới: " + e.getMessage());
            e.printStackTrace(); // In stack trace để debug
            // Không throw exception để không ảnh hưởng đến việc tạo bài thi
        }
        
        return part;
    }

    public Part updatePart(String id, Part part) throws ExecutionException, InterruptedException {
        // Kiểm tra trùng tên trong cùng một môn học (trừ chính nó)
        if (isDuplicateName(part.getName(), part.getCourseId(), id)) {
            throw new IllegalArgumentException("Tên bài thi đã tồn tại trong môn học này!");
        }
        part.setUpdatedAt(new Date());
        // Đảm bảo trường questions và score được lưu
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(id);
        docRef.set(part);
        part.setId(id);
        return part;
    }

    public void deletePart(String id) {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).delete();
    }

    public boolean isDuplicateName(String name, String courseId, String ignoreId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference parts = db.collection(COLLECTION_NAME);
        Query query = parts.whereEqualTo("courseId", courseId).whereEqualTo("name", name);
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        for (QueryDocumentSnapshot doc : docs) {
            if (!doc.getId().equals(ignoreId)) {
                return true;
            }
        }
        return false;
    }

    public List<Part> searchParts(String keyword) throws ExecutionException, InterruptedException {
        List<Part> all = getAllParts();
        String lower = keyword.trim().toLowerCase();
        List<Part> result = new ArrayList<>();
        for (Part p : all) {
            if (p.getName().toLowerCase().contains(lower) || p.getCourseId().toLowerCase().contains(lower)) {
                result.add(p);
            }
        }
        return result;
    }
    
    /**
     * Push notification cho tất cả students khi có bài thi mới
     */
    private void pushNotificationForNewExam(Part part) throws ExecutionException, InterruptedException {
        System.out.println("[NOTIFICATION] Bắt đầu xử lý notification cho bài thi: " + part.getName());
        System.out.println("[NOTIFICATION] Course ID: " + part.getCourseId());
        
        // Lấy thông tin course
        Course course = getCourseById(part.getCourseId());
        if (course == null) {
            System.err.println("Không tìm thấy course với ID: " + part.getCourseId());
            return;
        }
        
        System.out.println("[NOTIFICATION] Tìm thấy course: " + course.getName());
        
        // Lấy danh sách students trong course
        List<String> studentIds = course.getStudents();
        System.out.println("[NOTIFICATION] Danh sách students: " + (studentIds != null ? studentIds.toString() : "null"));
        
        if (studentIds == null || studentIds.isEmpty()) {
            System.out.println("Không có students nào trong course: " + course.getName());
            return;
        }
        
        // Tạo nội dung notification
        String title = "Bài thi mới";
        String message = String.format("Bạn có bài thi mới: \"%s\" trong lớp \"%s\"", 
            part.getName(), course.getName());
        
        System.out.println("[NOTIFICATION] Nội dung notification:");
        System.out.println("[NOTIFICATION] Title: " + title);
        System.out.println("[NOTIFICATION] Message: " + message);
        System.out.println("[NOTIFICATION] Type: exam_created");
        System.out.println("[NOTIFICATION] Related ID: " + part.getId());
        
        // Push notification cho tất cả students
        try {
            notificationService.pushNotificationToUsers(
                studentIds, 
                title, 
                message, 
                "exam_created", 
                part.getId()
            );
            
            System.out.println("Đã push notification cho " + studentIds.size() + " students về bài thi mới: " + part.getName());
        } catch (Exception e) {
            System.err.println("Lỗi khi gọi notificationService: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Lấy thông tin course theo ID
     */
    private Course getCourseById(String courseId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection("courses").document(courseId);
        DocumentSnapshot doc = docRef.get().get();
        if (doc.exists()) {
            Course course = doc.toObject(Course.class);
            course.setId(doc.getId());
            return course;
        }
        return null;
    }
} 