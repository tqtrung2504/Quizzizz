using Google.Cloud.Firestore;
using OnlineExam.Models;

namespace OnlineExam.Services;

public class QuestionService
{
    private const string CollectionName = "questions";
    private readonly FirestoreDb _db;
    private readonly QuestionBankService _questionBankService;

    public QuestionService(FirestoreDb db, QuestionBankService questionBankService)
    {
        _db = db;
        _questionBankService = questionBankService;
    }

    public async Task<Question> CreateAsync(Question question)
    {
        var docRef = await _db.Collection(CollectionName).AddAsync(question);
        question.Id = docRef.Id;
        await docRef.SetAsync(question);
        try { await UpdateStatsAsync(question.QuestionBankId!); } catch { /* ignore */ }
        return question;
    }

    public async Task<List<Question>> GetAllAsync(string questionBankId)
    {
        var snapshot = await _db.Collection(CollectionName)
            .WhereEqualTo("questionBankId", questionBankId).GetSnapshotAsync();
        return snapshot.Documents.Select(d =>
        {
            var q = d.ConvertTo<Question>();
            q.Id = d.Id;
            return q;
        }).ToList();
    }

    public async Task DeleteAsync(string id, string questionBankId)
    {
        await _db.Collection(CollectionName).Document(id).DeleteAsync();
        try { await UpdateStatsAsync(questionBankId); } catch { /* ignore */ }
    }

    public async Task<Question> UpdateAsync(string id, Question question)
    {
        question.Id = id;
        await _db.Collection(CollectionName).Document(id).SetAsync(question);
        try { await UpdateStatsAsync(question.QuestionBankId!); } catch { /* ignore */ }
        return question;
    }

    public async Task<Question?> GetByIdAsync(string id)
    {
        var snap = await _db.Collection(CollectionName).Document(id).GetSnapshotAsync();
        if (!snap.Exists) return null;
        var question = snap.ConvertTo<Question>();
        question.Id = snap.Id;
        return question;
    }

    private async Task UpdateStatsAsync(string questionBankId)
    {
        var questions = await GetAllAsync(questionBankId);
        var total = questions.Count;
        var easy = questions.Count(q => q.Level == "easy");
        var medium = questions.Count(q => q.Level == "medium");
        var hard = questions.Count(q => q.Level == "hard");
        await _questionBankService.UpdateQuestionStatsAsync(questionBankId, total, easy, medium, hard);
    }
}
