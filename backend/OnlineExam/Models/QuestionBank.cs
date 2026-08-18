using Google.Cloud.Firestore;

namespace OnlineExam.Models;

[FirestoreData]
public class QuestionBank
{
    [FirestoreDocumentId]
    public string? Id { get; set; }
    [FirestoreProperty("name")]
    public string? Name { get; set; }
    [FirestoreProperty("courseId")]
    public string? CourseId { get; set; }
    [FirestoreProperty("courseName")]
    public string? CourseName { get; set; }
    [FirestoreProperty("description")]
    public string? Description { get; set; }
    [FirestoreProperty("totalQuestions")]
    public int TotalQuestions { get; set; }
    [FirestoreProperty("easyCount")]
    public int EasyCount { get; set; }
    [FirestoreProperty("mediumCount")]
    public int MediumCount { get; set; }
    [FirestoreProperty("hardCount")]
    public int HardCount { get; set; }
}
