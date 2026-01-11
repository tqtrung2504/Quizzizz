package com.yourcompany.onlineexam.model;

import java.util.Date;
import java.util.Map;

public class ExamSession {
    private String id;
    private String partId;
    private String userEmail;
    private Date startTime;
    private Date endTime;
    private String status; // IN_PROGRESS, COMPLETED, TIMEOUT
    private Integer remainingTime; // Thời gian còn lại (giây)
    private Map<String, Object> answers; // Câu trả lời tạm thời

    public ExamSession() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPartId() { return partId; }
    public void setPartId(String partId) { this.partId = partId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Date getStartTime() { return startTime; }
    public void setStartTime(Date startTime) { this.startTime = startTime; }

    public Date getEndTime() { return endTime; }
    public void setEndTime(Date endTime) { this.endTime = endTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getRemainingTime() { return remainingTime; }
    public void setRemainingTime(Integer remainingTime) { this.remainingTime = remainingTime; }

    public Map<String, Object> getAnswers() { return answers; }
    public void setAnswers(Map<String, Object> answers) { this.answers = answers; }
} 