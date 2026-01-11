package com.yourcompany.onlineexam.service;

import com.yourcompany.onlineexam.model.ExamResult;
import com.yourcompany.onlineexam.model.Part;
import com.yourcompany.onlineexam.model.Question;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

public class ExamResultServiceTest {

    @InjectMocks
    private ExamResultService examResultService;

    @Mock
    private PartService partService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCalculateScoreForTrueFalseQuestion() throws Exception {
        // Arrange
        Part part = createTestPart();
        when(partService.getPartById(anyString())).thenReturn(part);

        ExamResult result = createTestExamResult();
        result.getDetails().get(0).setOptionIds("opt_0"); // Chọn "Đúng"

        // Act
        ExamResult calculatedResult = examResultService.calculateAndSaveResult(result);

        // Assert
        assertNotNull(calculatedResult);
        assertEquals(2.0, calculatedResult.getScore());
        assertTrue(calculatedResult.getDetails().get(0).isCorrect());
        assertEquals(2.0, calculatedResult.getDetails().get(0).getPoint());
    }

    @Test
    void testCalculateScoreForMultipleChoiceQuestion() throws Exception {
        // Arrange
        Part part = createTestPartWithMultipleChoice();
        when(partService.getPartById(anyString())).thenReturn(part);

        ExamResult result = createTestExamResult();
        result.getDetails().get(0).setOptionIds("opt_1,opt_2"); // Chọn đúng 2 đáp án

        // Act
        ExamResult calculatedResult = examResultService.calculateAndSaveResult(result);

        // Assert
        assertNotNull(calculatedResult);
        assertEquals(2.0, calculatedResult.getScore());
        assertTrue(calculatedResult.getDetails().get(0).isCorrect());
    }

    @Test
    void testCalculateScoreForIncorrectAnswer() throws Exception {
        // Arrange
        Part part = createTestPart();
        when(partService.getPartById(anyString())).thenReturn(part);

        ExamResult result = createTestExamResult();
        result.getDetails().get(0).setOptionIds("opt_1"); // Chọn "Sai"

        // Act
        ExamResult calculatedResult = examResultService.calculateAndSaveResult(result);

        // Assert
        assertNotNull(calculatedResult);
        assertEquals(0.0, calculatedResult.getScore());
        assertFalse(calculatedResult.getDetails().get(0).isCorrect());
        assertEquals(0.0, calculatedResult.getDetails().get(0).getPoint());
    }

    @Test
    void testCalculateScoreForUnansweredQuestion() throws Exception {
        // Arrange
        Part part = createTestPart();
        when(partService.getPartById(anyString())).thenReturn(part);

        ExamResult result = createTestExamResult();
        result.getDetails().get(0).setOptionIds(""); // Không trả lời

        // Act
        ExamResult calculatedResult = examResultService.calculateAndSaveResult(result);

        // Assert
        assertNotNull(calculatedResult);
        assertEquals(0.0, calculatedResult.getScore());
        assertFalse(calculatedResult.getDetails().get(0).isCorrect());
        assertEquals("Không trả lời", calculatedResult.getDetails().get(0).getAnswer());
    }

    @Test
    void testCalculateScoreForMultipleQuestions() throws Exception {
        // Arrange
        Part part = createTestPartWithMultipleQuestions();
        when(partService.getPartById(anyString())).thenReturn(part);

        ExamResult result = createTestExamResultWithMultipleQuestions();
        result.getDetails().get(0).setOptionIds("opt_0"); // Câu 1 đúng
        result.getDetails().get(1).setOptionIds("opt_1"); // Câu 2 sai

        // Act
        ExamResult calculatedResult = examResultService.calculateAndSaveResult(result);

        // Assert
        assertNotNull(calculatedResult);
        assertEquals(2.0, calculatedResult.getScore()); // Chỉ câu 1 đúng = 2 điểm
        assertTrue(calculatedResult.getDetails().get(0).isCorrect());
        assertFalse(calculatedResult.getDetails().get(1).isCorrect());
    }

    private Part createTestPart() {
        Part part = new Part();
        part.setId("test-part");
        part.setScore(10.0);

        List<Part.QuestionInTest> questions = new ArrayList<>();
        Part.QuestionInTest question = new Part.QuestionInTest();
        question.setId("q1");
        question.setContent("Hà Nội là thủ đô Việt Nam?");
        question.setType("truefalse");
        question.setScore(2.0);

        List<Question.Option> options = new ArrayList<>();
        Question.Option opt1 = new Question.Option();
        opt1.setId("opt_0");
        opt1.setText("Đúng");
        opt1.setCorrect(true);
        options.add(opt1);

        Question.Option opt2 = new Question.Option();
        opt2.setId("opt_1");
        opt2.setText("Sai");
        opt2.setCorrect(false);
        options.add(opt2);

        question.setOptions(options);
        questions.add(question);
        part.setQuestions(questions);

        return part;
    }

    private Part createTestPartWithMultipleChoice() {
        Part part = new Part();
        part.setId("test-part");
        part.setScore(10.0);

        List<Part.QuestionInTest> questions = new ArrayList<>();
        Part.QuestionInTest question = new Part.QuestionInTest();
        question.setId("q1");
        question.setContent("Chọn các số chẵn");
        question.setType("multiple");
        question.setScore(2.0);

        List<Question.Option> options = new ArrayList<>();
        Question.Option opt1 = new Question.Option();
        opt1.setId("opt_0");
        opt1.setText("1");
        opt1.setCorrect(false);
        options.add(opt1);

        Question.Option opt2 = new Question.Option();
        opt2.setId("opt_1");
        opt2.setText("2");
        opt2.setCorrect(true);
        options.add(opt2);

        Question.Option opt3 = new Question.Option();
        opt3.setId("opt_2");
        opt3.setText("4");
        opt3.setCorrect(true);
        options.add(opt3);

        question.setOptions(options);
        questions.add(question);
        part.setQuestions(questions);

        return part;
    }

    private Part createTestPartWithMultipleQuestions() {
        Part part = new Part();
        part.setId("test-part");
        part.setScore(10.0);

        List<Part.QuestionInTest> questions = new ArrayList<>();
        
        // Câu 1: True/False
        Part.QuestionInTest question1 = new Part.QuestionInTest();
        question1.setId("q1");
        question1.setContent("Hà Nội là thủ đô Việt Nam?");
        question1.setType("truefalse");
        question1.setScore(2.0);

        List<Question.Option> options1 = new ArrayList<>();
        Question.Option opt1 = new Question.Option();
        opt1.setId("opt_0");
        opt1.setText("Đúng");
        opt1.setCorrect(true);
        options1.add(opt1);

        Question.Option opt2 = new Question.Option();
        opt2.setId("opt_1");
        opt2.setText("Sai");
        opt2.setCorrect(false);
        options1.add(opt2);
        question1.setOptions(options1);
        questions.add(question1);

        // Câu 2: Single choice
        Part.QuestionInTest question2 = new Part.QuestionInTest();
        question2.setId("q2");
        question2.setContent("2 + 2 = ?");
        question2.setType("single");
        question2.setScore(2.0);

        List<Question.Option> options2 = new ArrayList<>();
        Question.Option opt3 = new Question.Option();
        opt3.setId("opt_0");
        opt3.setText("3");
        opt3.setCorrect(false);
        options2.add(opt3);

        Question.Option opt4 = new Question.Option();
        opt4.setId("opt_1");
        opt4.setText("4");
        opt4.setCorrect(true);
        options2.add(opt4);
        question2.setOptions(options2);
        questions.add(question2);

        part.setQuestions(questions);
        return part;
    }

    private ExamResult createTestExamResult() {
        ExamResult result = new ExamResult();
        result.setUserName("testuser");
        result.setTestName("test-part");
        result.setStatus("submitted");
        result.setSubmittedAt("2025-01-15T10:30:00Z");

        List<ExamResult.Detail> details = new ArrayList<>();
        ExamResult.Detail detail = new ExamResult.Detail();
        detail.setQuestionId("q1");
        detail.setQuestion("Hà Nội là thủ đô Việt Nam?");
        detail.setOptionIds("");
        details.add(detail);
        result.setDetails(details);

        return result;
    }

    private ExamResult createTestExamResultWithMultipleQuestions() {
        ExamResult result = new ExamResult();
        result.setUserName("testuser");
        result.setTestName("test-part");
        result.setStatus("submitted");
        result.setSubmittedAt("2025-01-15T10:30:00Z");

        List<ExamResult.Detail> details = new ArrayList<>();
        
        ExamResult.Detail detail1 = new ExamResult.Detail();
        detail1.setQuestionId("q1");
        detail1.setQuestion("Hà Nội là thủ đô Việt Nam?");
        detail1.setOptionIds("");
        details.add(detail1);

        ExamResult.Detail detail2 = new ExamResult.Detail();
        detail2.setQuestionId("q2");
        detail2.setQuestion("2 + 2 = ?");
        detail2.setOptionIds("");
        details.add(detail2);

        result.setDetails(details);
        return result;
    }
} 