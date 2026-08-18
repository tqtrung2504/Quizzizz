using Google.Cloud.Firestore;
using OnlineExam.Models;

namespace OnlineExam.Services;

public class QuestionBankService
{
    private const string CollectionName = "questionBanks";
    private readonly FirestoreDb _db;

    public QuestionBankService(FirestoreDb db) => _db = db;

    public async Task<List<QuestionBank>> GetAllAsync(string? search, string? courseId)
    {
        Query query = _db.Collection(CollectionName);
        if (!string.IsNullOrEmpty(search))
            query = query.WhereGreaterThanOrEqualTo("name", search).WhereLessThanOrEqualTo("name", search + "\uf8ff");
        if (!string.IsNullOrEmpty(courseId))
            query = query.WhereEqualTo("courseId", courseId);

        var snapshot = await query.GetSnapshotAsync();
        return snapshot.Documents.Select(d =>
        {
            var qb = d.ConvertTo<QuestionBank>();
            qb.Id = d.Id;
            return qb;
        }).ToList();
    }

    public async Task<QuestionBank?> GetByIdAsync(string id)
    {
        var snap = await _db.Collection(CollectionName).Document(id).GetSnapshotAsync();
        if (!snap.Exists) return null;
        var qb = snap.ConvertTo<QuestionBank>();
        qb.Id = snap.Id;
        return qb;
    }

    public async Task<QuestionBank> CreateAsync(QuestionBank qb)
    {
        qb.TotalQuestions = 0;
        qb.EasyCount = 0;
        qb.MediumCount = 0;
        qb.HardCount = 0;
        var docRef = await _db.Collection(CollectionName).AddAsync(qb);
        qb.Id = docRef.Id;
        return qb;
    }

    public async Task<QuestionBank> UpdateAsync(string id, QuestionBank qb)
    {
        await _db.Collection(CollectionName).Document(id).SetAsync(qb);
        qb.Id = id;
        return qb;
    }

    public async Task DeleteAsync(string id)
    {
        var questionsSnapshot = await _db.Collection("questions")
            .WhereEqualTo("questionBankId", id).GetSnapshotAsync();
        foreach (var doc in questionsSnapshot.Documents)
            await doc.Reference.DeleteAsync();
        await _db.Collection(CollectionName).Document(id).DeleteAsync();
    }

    public async Task UpdateQuestionStatsAsync(string id, int total, int easy, int medium, int hard)
    {
        var updates = new Dictionary<string, object>
        {
            ["totalQuestions"] = total,
            ["easyCount"] = easy,
            ["mediumCount"] = medium,
            ["hardCount"] = hard
        };
        await _db.Collection(CollectionName).Document(id).UpdateAsync(updates);
    }
}
