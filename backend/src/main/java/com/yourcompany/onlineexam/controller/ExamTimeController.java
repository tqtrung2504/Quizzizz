package com.yourcompany.onlineexam.controller;

import com.yourcompany.onlineexam.service.ExamTimeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/exam-time")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://doanliennganh.vercel.app"})
public class ExamTimeController {
    private final ExamTimeService examTimeService;
    private static final Logger logger = LoggerFactory.getLogger(ExamTimeController.class);

    public ExamTimeController(ExamTimeService examTimeService) {
        this.examTimeService = examTimeService;
    }

    /**
     * Kiểm tra thời gian hiện tại và trạng thái bài thi
     */
    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentTime() {
        try {
            Map<String, Object> timeInfo = examTimeService.getCurrentTimeInfo();
            return ResponseEntity.ok(timeInfo);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy thông tin thời gian hiện tại: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi server"));
        }
    }

    /**
     * Kiểm tra trạng thái bài thi theo thời gian
     */
    @GetMapping("/{partId}/time-status")
    public ResponseEntity<Map<String, Object>> getTimeStatus(@PathVariable String partId) {
        try {
            Map<String, Object> status = examTimeService.getTimeStatus(partId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("Lỗi khi kiểm tra trạng thái thời gian bài thi {}: ", partId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi server"));
        }
    }

    /**
     * Lấy thông tin đếm ngược thời gian
     */
    @GetMapping("/{partId}/countdown")
    public ResponseEntity<Map<String, Object>> getCountdown(@PathVariable String partId) {
        try {
            Map<String, Object> countdown = examTimeService.getCountdown(partId);
            return ResponseEntity.ok(countdown);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy thông tin đếm ngược bài thi {}: ", partId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi server"));
        }
    }

    /**
     * Kiểm tra xem có thể làm bài hay không
     */
    @GetMapping("/{partId}/can-take")
    public ResponseEntity<Map<String, Object>> canTakeExam(
            @PathVariable String partId,
            @RequestParam String userEmail) {
        try {
            Map<String, Object> result = examTimeService.canTakeExam(partId, userEmail);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Lỗi khi kiểm tra khả năng làm bài {}: ", partId, e);
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi server"));
        }
    }

    /**
     * Lấy danh sách bài thi theo trạng thái thời gian
     */
    @GetMapping("/by-status")
    public ResponseEntity<Map<String, Object>> getExamsByTimeStatus(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String courseId) {
        try {
            Map<String, Object> result = examTimeService.getExamsByTimeStatus(status, courseId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách bài thi theo trạng thái thời gian: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi server"));
        }
    }
} 