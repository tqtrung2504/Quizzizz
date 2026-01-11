package com.yourcompany.onlineexam.model;

import java.util.Date;
import java.util.List;
import com.yourcompany.onlineexam.model.Question;

public class Part {
    private String id;
    private String name;
    private String description;
    private Integer duration;
    private String courseId;
    private Date createdAt;
    private Date updatedAt;
    private Date openTime;  // Thời gian mở đề thi
    private Date closeTime; // Thời gian đóng đề thi
    private List<QuestionInTest> questions;
    private Double score;
    private Integer maxRetake;
    private Boolean randomizeQuestions;
    private Boolean enableAntiCheat;
    private Boolean enableTabWarning;
    private Boolean showAnswerAfterSubmit;
    private String scoringMode;

    public Part() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }

    public Date getOpenTime() { return openTime; }
    public void setOpenTime(Date openTime) { this.openTime = openTime; }

    public Date getCloseTime() { return closeTime; }
    public void setCloseTime(Date closeTime) { this.closeTime = closeTime; }

    public List<QuestionInTest> getQuestions() { return questions; }
    public void setQuestions(List<QuestionInTest> questions) { this.questions = questions; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Integer getMaxRetake() { return maxRetake; }
    public void setMaxRetake(Integer maxRetake) { this.maxRetake = maxRetake; }

    public Boolean getRandomizeQuestions() { return randomizeQuestions; }
    public void setRandomizeQuestions(Boolean randomizeQuestions) { this.randomizeQuestions = randomizeQuestions; }

    public Boolean getEnableAntiCheat() { return enableAntiCheat; }
    public void setEnableAntiCheat(Boolean enableAntiCheat) { this.enableAntiCheat = enableAntiCheat; }

    public Boolean getEnableTabWarning() { return enableTabWarning; }
    public void setEnableTabWarning(Boolean enableTabWarning) { this.enableTabWarning = enableTabWarning; }

    public Boolean getShowAnswerAfterSubmit() { return showAnswerAfterSubmit; }
    public void setShowAnswerAfterSubmit(Boolean showAnswerAfterSubmit) { this.showAnswerAfterSubmit = showAnswerAfterSubmit; }

    public String getScoringMode() { return scoringMode; }
    public void setScoringMode(String scoringMode) { this.scoringMode = scoringMode; }

    public static class QuestionInTest {
        private String id;
        private String content;
        private String type;
        private String level;
        private Double score;
        private List<Question.Option> options;
        private String answer;
        private List<Integer> correctAnswers;

        public QuestionInTest() {}
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getLevel() { return level; }
        public void setLevel(String level) { this.level = level; }
        public Double getScore() { return score; }
        public void setScore(Double score) { this.score = score; }
        public List<Question.Option> getOptions() { return options; }
        public void setOptions(List<Question.Option> options) { this.options = options; }
        public String getAnswer() { return answer; }
        public void setAnswer(String answer) { this.answer = answer; }
        public List<Integer> getCorrectAnswers() { return correctAnswers; }
        public void setCorrectAnswers(List<Integer> correctAnswers) { this.correctAnswers = correctAnswers; }
    }
} 