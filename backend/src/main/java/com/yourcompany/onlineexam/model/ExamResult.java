package com.yourcompany.onlineexam.model;

import java.util.List;

public class ExamResult {
    private String id;
    private String userName;
    private String userEmail;
    private String userStudentId;
    private String testName;
    private String testId;
    private double score;
    private String submittedAt;
    private String status; // 'submitted' | 'not_submitted'
    private List<Detail> details;
    private int leaveScreenCount;
    private String userId;

    public static class Detail {
        private String questionId;
        private String question;
        private String answer;
        private String optionIds;
        private boolean correct;
        private double point;

        // getters/setters
        public String getQuestionId() { return questionId; }
        public void setQuestionId(String questionId) { this.questionId = questionId; }
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }
        public String getOptionIds() { return optionIds; }
        public void setOptionIds(String optionIds) { this.optionIds = optionIds; }
        public boolean isCorrect() { return correct; }
        public void setCorrect(boolean correct) { this.correct = correct; }
        public double getPoint() { return point; }
        public void setPoint(double point) { this.point = point; }
    }

    // getters/setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getUserStudentId() { return userStudentId; }
    public void setUserStudentId(String userStudentId) { this.userStudentId = userStudentId; }
    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }
    public String getTestId() { return testId; }
    public void setTestId(String testId) { this.testId = testId; }
    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }
    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<Detail> getDetails() { return details; }
    public void setDetails(List<Detail> details) { this.details = details; }
    public int getLeaveScreenCount() { return leaveScreenCount; }
    public void setLeaveScreenCount(int leaveScreenCount) { this.leaveScreenCount = leaveScreenCount; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}