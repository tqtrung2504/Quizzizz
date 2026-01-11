// backend/src/main/java/com/yourcompany/onlineexam/controller/CourseController.java

package com.yourcompany.onlineexam.controller;

import com.yourcompany.onlineexam.model.Course;
import com.yourcompany.onlineexam.service.CourseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController()
@RequestMapping("/api/courses")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://doanliennganh.vercel.app"}) // Cho phép frontend gọi API (local và production)
public class CourseController {

    private final CourseService courseService;
    private static final Logger logger = LoggerFactory.getLogger(CourseController.class);

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        try {
            return ResponseEntity.ok(courseService.getAllCourses());
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Lỗi khi lấy danh sách courses: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody Course course) {
        try {
            Course createdCourse = courseService.createCourse(course);
            return ResponseEntity.ok(createdCourse);
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Lỗi khi tạo course: ", e);
            return ResponseEntity.status(500).build();
        }
    }

    // =================== CODE MỚI THÊM VÀO ===================

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable String id, @RequestBody Course courseDetails) {
        try {
            Course updatedCourse = courseService.updateCourse(id, courseDetails);
            return ResponseEntity.ok(updatedCourse);
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Lỗi khi cập nhật course {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable String id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Lỗi khi xóa course {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }
    
    // =================== QUẢN LÝ SINH VIÊN TRONG MÔN HỌC ===================
    @GetMapping("/{id}/students")
    public ResponseEntity<List<String>> getStudentsOfCourse(@PathVariable String id) {
        try {
            return ResponseEntity.ok(courseService.getStudentsOfCourse(id));
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Lỗi khi lấy danh sách sinh viên của course {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/{id}/students")
    public ResponseEntity<Void> addStudentToCourse(@PathVariable String id, @RequestBody String studentIdOrEmail) {
        try {
            courseService.addStudentToCourseByEmailOrUid(id, studentIdOrEmail);
            return ResponseEntity.ok().build();
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Lỗi khi thêm sinh viên vào course {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}/students/{studentId}")
    public ResponseEntity<Void> removeStudentFromCourse(@PathVariable String id, @PathVariable String studentId) {
        try {
            courseService.removeStudentFromCourse(id, studentId);
            return ResponseEntity.noContent().build();
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Lỗi khi xóa sinh viên khỏi course {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable String id) {
        try {
            Course course = courseService.getCourseById(id);
            if (course == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(course);
        } catch (ExecutionException | InterruptedException e) {
            logger.error("Lỗi khi lấy course {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }
    // ==========================================================
}