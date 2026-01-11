package com.yourcompany.onlineexam.controller;

import com.yourcompany.onlineexam.model.Part;
import com.yourcompany.onlineexam.service.ExamSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/exam-session")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://doanliennganh.vercel.app"})
public class ExamSessionController {
    private final ExamSessionService examSessionService;
    private static final Logger logger = LoggerFactory.getLogger(ExamSessionController.class);

    public ExamSessionController(ExamSessionService examSessionService) {
        this.examSessionService = examSessionService;
    }

    /**
     * Kiểm tra trạng thái bài thi (có thể làm bài hay không)
     */
    @GetMapping("/{partId}/status")
    public ResponseEntity<Map<String, Object>> getExamStatus(@PathVariable String partId) {
        try {
            Map<String, Object> status = examSessionService.getExamStatus(partId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("Lỗi khi kiểm tra trạng thái bài thi {}: ", partId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi server"));
        }
    }

    /**
     * Bắt đầu làm bài thi
     */
    @PostMapping("/{partId}/start")
    public ResponseEntity<Map<String, Object>> startExam(
            @PathVariable String partId,
            @RequestBody Map<String, String> request) {
        try {
            String userEmail = request.get("userEmail");
            if (userEmail == null || userEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Thiếu thông tin userEmail"));
            }

            Map<String, Object> result = examSessionService.startExam(partId, userEmail);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            logger.warn("Lỗi validation khi bắt đầu bài thi {}: {}", partId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Lỗi khi bắt đầu bài thi {}: ", partId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi server"));
        }
    }

    /**
     * Lấy danh sách bài thi có thể làm theo thời gian
     */
    @GetMapping("/available")
    public ResponseEntity<Map<String, Object>> getAvailableExams(
            @RequestParam String userEmail,
            @RequestParam(required = false) String courseId) {
        try {
            Map<String, Object> result = examSessionService.getAvailableExams(userEmail, courseId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách bài thi có thể làm: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi server"));
        }
    }

    /**
     * Kiểm tra thời gian còn lại của bài thi
     */
    @GetMapping("/{partId}/remaining-time")
    public ResponseEntity<Map<String, Object>> getRemainingTime(
            @PathVariable String partId,
            @RequestParam String userEmail) {
        try {
            Map<String, Object> result = examSessionService.getRemainingTime(partId, userEmail);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Lỗi khi kiểm tra thời gian còn lại bài thi {}: ", partId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi server"));
        }
    }

    /**
     * Nộp bài thi
     */
    @PostMapping("/{partId}/submit")
    public ResponseEntity<Map<String, Object>> submitExam(
            @PathVariable String partId,
            @RequestBody Map<String, Object> request) {
        try {
            String userEmail = (String) request.get("userEmail");
            Map<String, Object> answers = (Map<String, Object>) request.get("answers");
            
            if (userEmail == null || userEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Thiếu thông tin userEmail"));
            }

            Map<String, Object> result = examSessionService.submitExam(partId, userEmail, answers);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            logger.warn("Lỗi validation khi nộp bài thi {}: {}", partId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Lỗi khi nộp bài thi {}: ", partId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi server"));
        }
    }
} 