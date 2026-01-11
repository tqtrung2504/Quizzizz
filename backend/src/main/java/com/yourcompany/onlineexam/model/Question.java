package com.yourcompany.onlineexam.model;

import java.util.List;

public class Question {
    private String id;
    private String content;
    private String type; // "true_false", "multiple_choice", "essay"
    private String level; // "easy", "medium", "hard"
    private List<Option> options; // Sửa lại kiểu dữ liệu
    private String answer; // Đáp án đúng
    private String questionBankId; // Thuộc ngân hàng đề nào

    public Question() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public List<Option> getOptions() { return options; }
    public void setOptions(List<Option> options) { this.options = options; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getQuestionBankId() { return questionBankId; }
    public void setQuestionBankId(String questionBankId) { this.questionBankId = questionBankId; }

    // Inner class Option
    public static class Option {
        private String id; // Thêm id cho option
        private String text;
        private boolean correct;

        public Option() {}

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        public boolean isCorrect() { return correct; }
        public void setCorrect(boolean correct) { this.correct = correct; }
    }
}