using Google.Cloud.Firestore;
using OnlineExam.Models;

namespace OnlineExam.Services;

public class PartService
{
    private const string CollectionName = "parts";
    private readonly FirestoreDb _db;
    private readonly NotificationService _notificationService;

    public PartService(FirestoreDb db, NotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task<List<Part>> GetAllPartsAsync()
    {
        var snapshot = await _db.Collection(CollectionName).GetSnapshotAsync();
        var parts = new List<Part>();
        foreach (var doc in snapshot.Documents)
        {
            var part = doc.ConvertTo<Part>();
            part.Id = doc.Id;
            NormalizeQuestions(part);
            parts.Add(part);
        }
        return parts;
    }

    public async Task<Part?> GetPartByIdAsync(string id)
    {
        var snap = await _db.Collection(CollectionName).Document(id).GetSnapshotAsync();
        if (!snap.Exists) return null;
        var part = snap.ConvertTo<Part>();
        part.Id = snap.Id;
        NormalizeQuestions(part);
        return part;
    }

    public async Task<Part> CreatePartAsync(Part part)
    {
        if (await IsDuplicateNameAsync(part.Name!, part.CourseId!, null))
            throw new ArgumentException("Tên bài thi đã tồn tại trong môn học này!");

        part.CreatedAt = Timestamp.FromDateTime(DateTime.UtcNow);
        part.UpdatedAt = Timestamp.FromDateTime(DateTime.UtcNow);

        var docRef = await _db.Collection(CollectionName).AddAsync(part);
        part.Id = docRef.Id;
        await docRef.SetAsync(part);

        try
        {
            await PushNotificationForNewExamAsync(part);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi push notification cho bài thi mới: {ex.Message}");
        }

        return part;
    }

    public async Task<Part> UpdatePartAsync(string id, Part part)
    {
        if (await IsDuplicateNameAsync(part.Name!, part.CourseId!, id))
            throw new ArgumentException("Tên bài thi đã tồn tại trong môn học này!");

        part.UpdatedAt = Timestamp.FromDateTime(DateTime.UtcNow);
        await _db.Collection(CollectionName).Document(id).SetAsync(part);
        part.Id = id;
        return part;
    }

    public async Task DeletePartAsync(string id) =>
        await _db.Collection(CollectionName).Document(id).DeleteAsync();

    public async Task<List<Part>> SearchPartsAsync(string keyword)
    {
        var all = await GetAllPartsAsync();
        var lower = keyword.Trim().ToLowerInvariant();
        return all.Where(p =>
            (p.Name?.ToLowerInvariant().Contains(lower) ?? false) ||
            (p.CourseId?.ToLowerInvariant().Contains(lower) ?? false)).ToList();
    }

    private async Task<bool> IsDuplicateNameAsync(string name, string courseId, string? ignoreId)
    {
        var snapshot = await _db.Collection(CollectionName)
            .WhereEqualTo("courseId", courseId)
            .WhereEqualTo("name", name).GetSnapshotAsync();
        return snapshot.Documents.Any(d => d.Id != ignoreId);
    }

    private static void NormalizeQuestions(Part part)
    {
        if (part.Questions == null) return;
        foreach (var q in part.Questions)
        {
            if (q.Options == null) continue;
            var correctIdxs = new List<int>();
            for (var idx = 0; idx < q.Options.Count; idx++)
            {
                if (q.Options[idx].Correct) correctIdxs.Add(idx);
            }
            if (correctIdxs.Count > 1)
            {
                q.Type = "multiple_choice";
                q.CorrectAnswers = correctIdxs;
            }
            else if (correctIdxs.Count == 1)
            {
                q.Type = "single_choice";
                q.Answer = correctIdxs[0].ToString();
                q.CorrectAnswers = null;
            }
            else
            {
                q.CorrectAnswers = null;
            }
        }
    }

    private async Task PushNotificationForNewExamAsync(Part part)
    {
        var courseSnap = await _db.Collection("courses").Document(part.CourseId!).GetSnapshotAsync();
        if (!courseSnap.Exists) return;

        var course = courseSnap.ConvertTo<Course>();
        course.Id = courseSnap.Id;
        var studentIds = course.Students;
        if (studentIds == null || studentIds.Count == 0) return;

        var title = "Bài thi mới";
        var message = $"Bạn có bài thi mới: \"{part.Name}\" trong lớp \"{course.Name}\"";
        _notificationService.PushNotificationToUsers(studentIds, title, message, "exam_created", part.Id);
    }
}
