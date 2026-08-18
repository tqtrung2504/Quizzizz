using Google.Cloud.Firestore;

namespace OnlineExam.Models;

[FirestoreData]
public class Question
{
    [FirestoreDocumentId]
    public string? Id { get; set; }
    [FirestoreProperty("content")]
    public string? Content { get; set; }
    [FirestoreProperty("type")]
    public string? Type { get; set; }
    [FirestoreProperty("level")]
    public string? Level { get; set; }
    [FirestoreProperty("options")]
    public List<QuestionOption>? Options { get; set; }
    [FirestoreProperty("answer")]
    public string? Answer { get; set; }
    [FirestoreProperty("questionBankId")]
    public string? QuestionBankId { get; set; }
}

[FirestoreData]
public class QuestionOption
{
    [FirestoreProperty("id")]
    public string? Id { get; set; }
    [FirestoreProperty("text")]
    public string? Text { get; set; }
    [FirestoreProperty("correct")]
    public bool Correct { get; set; }
}
