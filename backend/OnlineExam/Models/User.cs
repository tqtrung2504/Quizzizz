using Google.Cloud.Firestore;

namespace OnlineExam.Models;

[FirestoreData]
public class User
{
    [FirestoreDocumentId]
    public string? Uid { get; set; }
    [FirestoreProperty("email")]
    public string? Email { get; set; }
    [FirestoreProperty("username")]
    public string? Username { get; set; }
    [FirestoreProperty("firstName")]
    public string? FirstName { get; set; }
    [FirestoreProperty("lastName")]
    public string? LastName { get; set; }
    [FirestoreProperty("imageUrl")]
    public string? ImageUrl { get; set; }
    [FirestoreProperty("role")]
    public string? Role { get; set; }
    [FirestoreProperty("intakeId")]
    public string? IntakeId { get; set; }
    [FirestoreProperty("createdAt")]
    public Timestamp? CreatedAt { get; set; }
    [FirestoreProperty("lastLoginAt")]
    public Timestamp? LastLoginAt { get; set; }
    [FirestoreProperty("isDeleted")]
    public bool? IsDeleted { get; set; }
    [FirestoreProperty("phone")]
    public string? Phone { get; set; }
    [FirestoreProperty("address")]
    public string? Address { get; set; }
    [FirestoreProperty("bio")]
    public string? Bio { get; set; }
    [FirestoreProperty("studentId")]
    public string? StudentId { get; set; }
    [FirestoreProperty("major")]
    public string? Major { get; set; }
    [FirestoreProperty("year")]
    public string? Year { get; set; }
}
