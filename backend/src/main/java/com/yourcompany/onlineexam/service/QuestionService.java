package com.yourcompany.onlineexam.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.yourcompany.onlineexam.model.Question;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class QuestionService {
    private static final String COLLECTION_NAME = "questions";

    @Autowired
    private QuestionBankService questionBankService;

    public Question create(Question question) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<DocumentReference> future = db.collection(COLLECTION_NAME).add(question);
        String id = future.get().getId();
        question.setId(id);
        db.collection(COLLECTION_NAME).document(id).set(question);
        try {
            updateStats(question.getQuestionBankId());
        } catch (Exception e) {
            // log lỗi nếu cần
        }
        return question;
    }

    public List<Question> getAll(String questionBankId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        CollectionReference ref = db.collection(COLLECTION_NAME);
        Query query = ref.whereEqualTo("questionBankId", questionBankId);
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> docs = future.get().getDocuments();
        List<Question> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            Question q = doc.toObject(Question.class);
            q.setId(doc.getId());
            result.add(q);
        }
        return result;
    }

    private void updateStats(String questionBankId) throws Exception {
        // Lấy tất cả câu hỏi thuộc bankId
        List<Question> questions = getAll(questionBankId);
        int total = questions.size();
        int easy = (int) questions.stream().filter(q -> "easy".equals(q.getLevel())).count();
        int medium = (int) questions.stream().filter(q -> "medium".equals(q.getLevel())).count();
        int hard = (int) questions.stream().filter(q -> "hard".equals(q.getLevel())).count();
        questionBankService.updateQuestionStats(questionBankId, total, easy, medium, hard);
    }

    public void delete(String id, String questionBankId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).delete();
        // Cập nhật lại số lượng câu hỏi cho ngân hàng đề
        try {
            updateStats(questionBankId);
        } catch (Exception e) {
            // log lỗi nếu cần
        }
    }

    public Question update(String id, Question question) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        question.setId(id);
        db.collection(COLLECTION_NAME).document(id).set(question);
        // Cập nhật lại số lượng câu hỏi cho ngân hàng đề
        try {
            updateStats(question.getQuestionBankId());
        } catch (Exception e) {
            // log lỗi nếu cần
        }
        return question;
    }

    public Question getById(String id) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        DocumentSnapshot doc = db.collection(COLLECTION_NAME).document(id).get().get();
        if (doc.exists()) {
            Question question = doc.toObject(Question.class);
            question.setId(doc.getId());
            return question;
        }
        return null;
    }
} 