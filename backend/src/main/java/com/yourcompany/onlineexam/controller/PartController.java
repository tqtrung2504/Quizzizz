package com.yourcompany.onlineexam.controller;

import com.yourcompany.onlineexam.model.Part;
import com.yourcompany.onlineexam.service.PartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/parts")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "https://doanliennganh.vercel.app"})
public class PartController {
    private final PartService partService;
    private static final Logger logger = LoggerFactory.getLogger(PartController.class);

    public PartController(PartService partService) {
        this.partService = partService;
    }

    @GetMapping
    public ResponseEntity<List<Part>> getAllParts(@RequestParam(value = "search", required = false) String search) {
        try {
            if (search != null && !search.isEmpty()) {
                return ResponseEntity.ok(partService.searchParts(search));
            }
            return ResponseEntity.ok(partService.getAllParts());
        } catch (Exception e) {
            logger.error("Lỗi khi lấy danh sách parts với search '{}': ", search, e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Part> getPartById(@PathVariable String id) {
        try {
            Part part = partService.getPartById(id);
            if (part == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(part);
        } catch (Exception e) {
            logger.error("Lỗi khi lấy part {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createPart(@RequestBody Part part) {
        try {
            Part created = partService.createPart(part);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            logger.warn("Lỗi validation khi tạo part: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Lỗi khi tạo part: ", e);
            return ResponseEntity.status(500).body("Lỗi server!");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePart(@PathVariable String id, @RequestBody Part part) {
        try {
            Part updated = partService.updatePart(id, part);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            logger.warn("Lỗi validation khi cập nhật part {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Lỗi khi cập nhật part {}: ", id, e);
            return ResponseEntity.status(500).body("Lỗi server!");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePart(@PathVariable String id) {
        try {
            partService.deletePart(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Lỗi khi xóa part {}: ", id, e);
            return ResponseEntity.status(500).build();
        }
    }
} 