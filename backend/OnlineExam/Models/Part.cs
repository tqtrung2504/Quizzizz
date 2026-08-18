using Google.Cloud.Firestore;

namespace OnlineExam.Models;

[FirestoreData]
public class Part
{
    [FirestoreDocumentId]
    public string? Id { get; set; }
    [FirestoreProperty("name")]
    public string? Name { get; set; }
    [FirestoreProperty("description")]
    public string? Description { get; set; }
    [FirestoreProperty("duration")]
    public int? Duration { get; set; }
    [FirestoreProperty("courseId")]
    public string? CourseId { get; set; }
    [FirestoreProperty("createdAt")]
    public Timestamp? CreatedAt { get; set; }
    [FirestoreProperty("updatedAt")]
    public Timestamp? UpdatedAt { get; set; }
    [FirestoreProperty("openTime")]
    public Timestamp? OpenTime { get; set; }
    [FirestoreProperty("closeTime")]
    public Timestamp? CloseTime { get; set; }
    [FirestoreProperty("questions")]
    public List<QuestionInTest>? Questions { get; set; }
    [FirestoreProperty("score")]
    public double? Score { get; set; }
    [FirestoreProperty("maxRetake")]
    public int? MaxRetake { get; set; }
    [FirestoreProperty("randomizeQuestions")]
    public bool? RandomizeQuestions { get; set; }
    [FirestoreProperty("enableAntiCheat")]
    public bool? EnableAntiCheat { get; set; }
    [FirestoreProperty("enableTabWarning")]
    public bool? EnableTabWarning { get; set; }
    [FirestoreProperty("showAnswerAfterSubmit")]
    public bool? ShowAnswerAfterSubmit { get; set; }
    [FirestoreProperty("scoringMode")]
    public string? ScoringMode { get; set; }
}

[FirestoreData]
public class QuestionInTest
{
    [FirestoreProperty("id")]
    public string? Id { get; set; }
    [FirestoreProperty("content")]
    public string? Content { get; set; }
    [FirestoreProperty("type")]
    public string? Type { get; set; }
    [FirestoreProperty("level")]
    public string? Level { get; set; }
    [FirestoreProperty("score")]
    public double? Score { get; set; }
    [FirestoreProperty("options")]
    public List<QuestionOption>? Options { get; set; }
    [FirestoreProperty("answer")]
    public string? Answer { get; set; }
    [FirestoreProperty("correctAnswers")]
    public List<int>? CorrectAnswers { get; set; }
}
