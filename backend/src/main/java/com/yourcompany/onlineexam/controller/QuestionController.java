package com.yourcompany.onlineexam.controller;

import com.yourcompany.onlineexam.model.Question;
import com.yourcompany.onlineexam.service.QuestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.ExecutionException;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://doanliennganh.vercel.app"})
public class QuestionController {
    private final QuestionService questionService;
    private static final Logger logger = LoggerFactory.getLogger(QuestionController.class);

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Question question) {
        try {
            Question created = questionService.create(question);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            logger.error("Lỗi khi tạo question: ", e);
            return ResponseEntity.status(500).body("Lỗi server!");
        }
    }

    @GetMapping
    public ResponseEntity<List<Question>> getAll(@RequestParam String questionBankId) {
        try {
            return ResponseEntity.ok(questionService.getAll(questionBankId));
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách questions cho bank {}: ", questionBankId, e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping
    public ResponseEntity<?> delete(@RequestParam String id, @RequestParam String questionBankId) {
        try {
            questionService.delete(id, questionBankId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Lỗi khi xóa question {} từ bank {}: ", id, questionBankId, e);
            return ResponseEntity.status(500).body("Lỗi khi xóa câu hỏi!");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Question question) {
        try {
            Question updated = questionService.update(id, question);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Lỗi khi cập nhật question {}: ", id, e);
            return ResponseEntity.status(500).body("Lỗi khi cập nhật câu hỏi!");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Question> getById(@PathVariable String id) {
        try {
            Question question = questionService.getById(id);
            if (question == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(question);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy question {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/test-create-and-update")
    public ResponseEntity<String> testCreateAndUpdate() throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        // 1. Tạo câu hỏi mẫu
        Map<String, Object> data = new HashMap<>();
        data.put("content", "Câu hỏi mẫu tự động?");
        data.put("type", "multiple");
        data.put("level", "easy");
        data.put("options", Arrays.asList(
            new HashMap<String, Object>() {{ put("text", "1"); put("correct", false); }},
            new HashMap<String, Object>() {{ put("text", "2"); put("correct", true); }},
            new HashMap<String, Object>() {{ put("text", "3"); put("correct", false); }},
            new HashMap<String, Object>() {{ put("text", "4"); put("correct", true); }}
        ));
        data.put("questionBankId", "gNkQmiR3ZTr5LjyfZGXX");
        DocumentReference docRef = db.collection("questions").document();
        String id = docRef.getId();
        data.put("id", id);
        docRef.set(data).get();
        // 2. Sửa lại nội dung câu hỏi vừa tạo
        data.put("content", "Câu hỏi đã sửa tự động!");
        docRef.set(data).get();
        return ResponseEntity.ok("Tạo và sửa câu hỏi thành công với id: " + id);
    }
} 