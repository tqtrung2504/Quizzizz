package com.yourcompany.onlineexam.model;

public class QuestionBank {
    private String id;
    private String name;
    private String courseId;
    private String courseName;
    private String description;
    private int totalQuestions;
    private int easyCount;
    private int mediumCount;
    private int hardCount;

    public QuestionBank() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getEasyCount() { return easyCount; }
    public void setEasyCount(int easyCount) { this.easyCount = easyCount; }

    public int getMediumCount() { return mediumCount; }
    public void setMediumCount(int mediumCount) { this.mediumCount = mediumCount; }

    public int getHardCount() { return hardCount; }
    public void setHardCount(int hardCount) { this.hardCount = hardCount; }
} 