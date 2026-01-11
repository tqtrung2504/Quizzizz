package com.yourcompany.onlineexam.controller;

import com.yourcompany.onlineexam.model.QuestionBank;
import com.yourcompany.onlineexam.service.QuestionBankService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/question-banks")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://doanliennganh.vercel.app"})
public class QuestionBankController {
    private final QuestionBankService questionBankService;
    private static final Logger logger = LoggerFactory.getLogger(QuestionBankController.class);

    public QuestionBankController(QuestionBankService questionBankService) {
        this.questionBankService = questionBankService;
    }

    @GetMapping
    public ResponseEntity<List<QuestionBank>> getAll(@RequestParam(value = "search", required = false) String search,
                                                     @RequestParam(value = "courseId", required = false) String courseId) {
        try {
            return ResponseEntity.ok(questionBankService.getAll(search, courseId));
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách question banks với search '{}' và courseId '{}': ", search, courseId, e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionBank> getById(@PathVariable String id) {
        try {
            QuestionBank qb = questionBankService.getById(id);
            if (qb == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(qb);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy question bank {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody QuestionBank qb) {
        try {
            QuestionBank created = questionBankService.create(qb);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            logger.error("Lỗi khi tạo question bank: ", e);
            return ResponseEntity.status(500).body("Lỗi server!");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody QuestionBank qb) {
        try {
            QuestionBank updated = questionBankService.update(id, qb);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Lỗi khi cập nhật question bank {}: ", id, e);
            return ResponseEntity.status(500).body("Lỗi server!");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        try {
            questionBankService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Lỗi khi xóa question bank {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }
} 