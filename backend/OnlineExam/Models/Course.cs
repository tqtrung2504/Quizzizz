using Google.Cloud.Firestore;

namespace OnlineExam.Models;

[FirestoreData]
public class Course
{
    [FirestoreDocumentId]
    public string? Id { get; set; }
    [FirestoreProperty("code")]
    public string? Code { get; set; }
    [FirestoreProperty("name")]
    public string? Name { get; set; }
    [FirestoreProperty("description")]
    public string? Description { get; set; }
    [FirestoreProperty("credits")]
    public int? Credits { get; set; }
    [FirestoreProperty("department")]
    public string? Department { get; set; }
    [FirestoreProperty("createdAt")]
    public Timestamp? CreatedAt { get; set; }
    [FirestoreProperty("updatedAt")]
    public Timestamp? UpdatedAt { get; set; }
    [FirestoreProperty("students")]
    public List<string>? Students { get; set; }
}
