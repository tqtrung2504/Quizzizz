package com.yourcompany.onlineexam.controller;

import com.yourcompany.onlineexam.model.ExamResult;
import com.yourcompany.onlineexam.service.ExamResultService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-results")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://doanliennganh.vercel.app"})
public class ExamResultController {
    @Autowired
    private ExamResultService examResultService;
    private static final Logger logger = LoggerFactory.getLogger(ExamResultController.class);

    @GetMapping
    public ResponseEntity<List<ExamResult>> getAllResults() {
        try {
            List<ExamResult> results = examResultService.getAllResultsFromFirebase();
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách exam results: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> saveResult(@RequestBody ExamResult result) {
        try {
            examResultService.saveResult(result);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Lỗi khi lưu exam result: ", e);
            return ResponseEntity.status(500).body("Lỗi khi lưu kết quả thi!");
        }
    }

    @PostMapping("/submit-and-get-result")
    public ResponseEntity<ExamResult> submitAndGetResult(@RequestBody ExamResult result) {
        try {
            logger.info("Nhận yêu cầu nộp bài thi từ user: {}, test: {}", result.getUserName(), result.getTestName());
            
            // Tính toán điểm và lưu kết quả
            ExamResult calculatedResult = examResultService.calculateAndSaveResult(result);
            
            logger.info("Đã tính toán xong điểm cho user: {}, điểm: {}", result.getUserName(), calculatedResult.getScore());
            return ResponseEntity.ok(calculatedResult);
        } catch (Exception e) {
            logger.error("Lỗi khi xử lý nộp bài thi: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/attempt-count/{userId}/{testId}")
    public ResponseEntity<Integer> getAttemptCount(@PathVariable String userId, @PathVariable String testId) {
        try {
            int attemptCount = examResultService.getAttemptCountByUserId(userId, testId);
            return ResponseEntity.ok(attemptCount);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy số lượt thi: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/can-take-test/{userId}/{testId}/{maxRetake}")
    public ResponseEntity<Boolean> canTakeTest(@PathVariable String userId, @PathVariable String testId, @PathVariable int maxRetake) {
        try {
            boolean canTake = examResultService.canTakeTestByUserId(userId, testId, maxRetake);
            return ResponseEntity.ok(canTake);
        } catch (Exception e) {
            logger.error("Lỗi khi kiểm tra quyền thi: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/attempt-count-by-user/{userId}/{testId}")
    public ResponseEntity<Integer> getAttemptCountByUserId(@PathVariable String userId, @PathVariable String testId) {
        try {
            int attemptCount = examResultService.getAttemptCountByUserId(userId, testId);
            return ResponseEntity.ok(attemptCount);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy số lượt thi theo userId: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/can-take-test-by-user/{userId}/{testId}/{maxRetake}")
    public ResponseEntity<Boolean> canTakeTestByUserId(@PathVariable String userId, @PathVariable String testId, @PathVariable int maxRetake) {
        try {
            boolean canTake = examResultService.canTakeTestByUserId(userId, testId, maxRetake);
            return ResponseEntity.ok(canTake);
        } catch (Exception e) {
            logger.error("Lỗi khi kiểm tra quyền thi theo userId: ", e);
            return ResponseEntity.status(500).build();
        }
    }
} 