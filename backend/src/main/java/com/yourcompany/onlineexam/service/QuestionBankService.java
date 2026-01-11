package com.yourcompany.onlineexam.service;

import com.yourcompany.onlineexam.model.QuestionBank;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class QuestionBankService {
    private static final String COLLECTION_NAME = "questionBanks";

    public List<QuestionBank> getAll(String search, String courseId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference ref = db.collection(COLLECTION_NAME);
        Query query = ref;
        if (search != null && !search.isEmpty()) {
            query = query.whereGreaterThanOrEqualTo("name", search).whereLessThanOrEqualTo("name", search + "\uf8ff");
        }
        if (courseId != null && !courseId.isEmpty()) {
            query = query.whereEqualTo("courseId", courseId);
        }
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        List<QuestionBank> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            QuestionBank qb = doc.toObject(QuestionBank.class);
            qb.setId(doc.getId());
            result.add(qb);
        }
        return result;
    }

    public QuestionBank getById(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(id);
        DocumentSnapshot doc = docRef.get().get();
        if (doc.exists()) {
            QuestionBank qb = doc.toObject(QuestionBank.class);
            qb.setId(doc.getId());
            return qb;
        }
        return null;
    }

    public QuestionBank create(QuestionBank qb) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        qb.setTotalQuestions(0);
        qb.setEasyCount(0);
        qb.setMediumCount(0);
        qb.setHardCount(0);
        ApiFuture<DocumentReference> future = db.collection(COLLECTION_NAME).add(qb);
        String id = future.get().getId();
        qb.setId(id);
        return qb;
    }

    public QuestionBank update(String id, QuestionBank qb) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(id);
        docRef.set(qb);
        qb.setId(id);
        return qb;
    }

    public void delete(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        // Xóa tất cả câu hỏi thuộc ngân hàng đề này
        CollectionReference questionsRef = db.collection("questions");
        Query query = questionsRef.whereEqualTo("questionBankId", id);
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        for (QueryDocumentSnapshot doc : docs) {
            doc.getReference().delete();
        }
        // Xóa ngân hàng đề
        db.collection(COLLECTION_NAME).document(id).delete();
    }

    // Hàm cập nhật số lượng câu hỏi, phân loại độ khó (gọi khi thêm/import câu hỏi)
    public void updateQuestionStats(String id, int total, int easy, int medium, int hard) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(id);
        Map<String, Object> updates = new HashMap<>();
        updates.put("totalQuestions", total);
        updates.put("easyCount", easy);
        updates.put("mediumCount", medium);
        updates.put("hardCount", hard);
        docRef.update(updates);
    }
} 