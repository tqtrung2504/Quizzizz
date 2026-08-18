using Google.Cloud.Firestore;
using OnlineExam.Models;

namespace OnlineExam.Services;

public class ExamResultService
{
    private readonly List<ExamResult> _results = new();
    private readonly FirestoreDb _db;
    private readonly PartService _partService;

    public ExamResultService(FirestoreDb db, PartService partService)
    {
        _db = db;
        _partService = partService;
    }

    public List<ExamResult> GetAllResults() => _results;

    public async Task<List<ExamResult>> GetAllResultsFromFirebaseAsync()
    {
        try
        {
            var snapshot = await _db.Collection("exam_results").GetSnapshotAsync();
            var firebaseResults = new List<ExamResult>();

            foreach (var doc in snapshot.Documents)
            {
                var result = new ExamResult
                {
                    Id = doc.Id,
                    UserName = doc.GetValue<string>("userName"),
                    UserEmail = doc.GetValue<string>("userEmail"),
                    UserStudentId = doc.GetValue<string>("userStudentId"),
                    TestName = doc.GetValue<string>("testName"),
                    TestId = doc.GetValue<string>("testId"),
                    Score = doc.ContainsField("score") ? doc.GetValue<double>("score") : 0,
                    SubmittedAt = doc.GetValue<string>("submittedAt"),
                    Status = doc.GetValue<string>("status"),
                    LeaveScreenCount = doc.ContainsField("leaveScreenCount") ? (int)doc.GetValue<long>("leaveScreenCount") : 0,
                    UserId = doc.GetValue<string>("userId")
                };

                if (doc.ContainsField("details"))
                {
                    var detailsData = doc.GetValue<List<Dictionary<string, object>>>("details");
                    if (detailsData != null)
                    {
                        result.Details = detailsData.Select(d => new ExamResultDetail
                        {
                            QuestionId = d.GetValueOrDefault("questionId")?.ToString(),
                            Question = d.GetValueOrDefault("question")?.ToString(),
                            Answer = d.GetValueOrDefault("answer")?.ToString(),
                            OptionIds = d.GetValueOrDefault("optionIds")?.ToString(),
                            Correct = d.GetValueOrDefault("correct") is bool b && b,
                            Point = d.GetValueOrDefault("point") is double pd ? pd :
                                    d.GetValueOrDefault("point") is long pl ? pl : 0
                        }).ToList();
                    }
                }

                firebaseResults.Add(result);
            }

            return firebaseResults;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[ERROR] Lỗi khi lấy dữ liệu từ Firebase: {ex.Message}");
            return _results;
        }
    }

    public async Task<int> GetAttemptCountByUserIdAsync(string userId, string testId)
    {
        try
        {
            var snapshot = await _db.Collection("exam_results")
                .WhereEqualTo("userId", userId)
                .WhereEqualTo("testId", testId).GetSnapshotAsync();
            return snapshot.Count;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[ERROR] Lỗi khi đếm số lượt thi: {ex.Message}");
            return 0;
        }
    }

    public async Task<bool> CanTakeTestByUserIdAsync(string userId, string testId, int maxRetake)
    {
        var count = await GetAttemptCountByUserIdAsync(userId, testId);
        return count < maxRetake;
    }

    public async Task SaveResultAsync(ExamResult result)
    {
        try
        {
            var part = await _partService.GetPartByIdAsync(result.TestName ?? result.TestId ?? "");
            if (part?.Questions == null || result.Details == null)
            {
                _results.Add(result);
                return;
            }

            var submittedMap = result.Details.ToDictionary(d => d.QuestionId!, d => d);
            double totalScore = 0;

            foreach (var question in part.Questions)
            {
                if (!submittedMap.TryGetValue(question.Id!, out var submittedDetail)) continue;

                var correctOptionIds = question.Options?
                    .Where(o => o.Correct).Select(o => o.Id!).ToHashSet() ?? new HashSet<string>();
                var userOptionIds = new HashSet<string>();
                if (!string.IsNullOrEmpty(submittedDetail.OptionIds))
                {
                    foreach (var s in submittedDetail.OptionIds.Split(','))
                        userOptionIds.Add(s.Trim());
                }

                var type = question.Type?.ToLowerInvariant() ?? "";
                var isCorrect = type == "multiple"
                    ? correctOptionIds.SetEquals(userOptionIds)
                    : correctOptionIds.Count == 1 && userOptionIds.Count == 1 &&
                      correctOptionIds.First() == userOptionIds.First();

                submittedDetail.Correct = isCorrect;
                var point = isCorrect ? (question.Score > 0 ? question.Score.Value : 1.0) : 0;
                submittedDetail.Point = point;
                if (isCorrect) totalScore += point;
            }

            result.Score = Math.Round(totalScore * 10.0) / 10.0;
            await SaveToFirestoreAsync(result);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[ERROR] Lỗi khi lưu kết quả thi: {ex.Message}");
            throw new InvalidOperationException("Lỗi khi lưu kết quả thi", ex);
        }
        _results.Add(result);
    }

    public async Task<ExamResult> CalculateAndSaveResultAsync(ExamResult result)
    {
        var partId = result.TestId ?? result.TestName
            ?? throw new InvalidOperationException("Thiếu testId");

        var part = await _partService.GetPartByIdAsync(partId)
            ?? throw new InvalidOperationException($"Không tìm thấy đề thi với ID: {partId}");

        if (result.Details == null || result.Details.Count == 0)
            throw new InvalidOperationException("Không có câu trả lời nào được gửi");

        var submittedMap = result.Details
            .Where(d => d.QuestionId != null)
            .ToDictionary(d => d.QuestionId!, d => d);

        double totalScore = 0;
        var totalQuestions = part.Questions?.Count ?? 0;
        var answeredQuestions = 0;

        if (part.Questions != null)
        {
            foreach (var question in part.Questions)
            {
                if (!submittedMap.TryGetValue(question.Id!, out var submittedDetail))
                {
                    result.Details.Add(new ExamResultDetail
                    {
                        QuestionId = question.Id ?? $"unknown_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                        Question = question.Content ?? "Câu hỏi không có nội dung",
                        OptionIds = "",
                        Correct = false,
                        Point = 0,
                        Answer = "Không trả lời"
                    });
                    continue;
                }

                answeredQuestions++;
                EnsureOptionsHaveIds(question);

                var correctOptionIds = question.Options?
                    .Where(o => o.Correct).Select(o => o.Id!).ToHashSet() ?? new HashSet<string>();
                var userOptionIds = new HashSet<string>();
                if (!string.IsNullOrEmpty(submittedDetail.OptionIds))
                {
                    foreach (var id in submittedDetail.OptionIds.Split(','))
                        userOptionIds.Add(id.Trim());
                }

                var isCorrect = CheckAnswerCorrect(question.Type, correctOptionIds, userOptionIds);
                var questionScore = CalculateQuestionScore(question, isCorrect, correctOptionIds, userOptionIds);
                var answerText = CreateAnswerText(question, userOptionIds);

                submittedDetail.Correct = isCorrect;
                submittedDetail.Point = questionScore;
                submittedDetail.Question = question.Content ?? "Câu hỏi không có nội dung";
                submittedDetail.Answer = answerText;
                totalScore += questionScore;
            }
        }

        result.Score = Math.Round(totalScore * 10.0) / 10.0;

        try
        {
            var firebaseData = new Dictionary<string, object?>
            {
                ["userName"] = result.UserName ?? "Unknown",
                ["userEmail"] = result.UserEmail,
                ["userStudentId"] = result.UserStudentId,
                ["testName"] = result.TestName ?? "Unknown",
                ["testId"] = result.TestId,
                ["score"] = result.Score,
                ["submittedAt"] = result.SubmittedAt ?? DateTime.UtcNow.ToString(),
                ["status"] = result.Status ?? "submitted",
                ["details"] = result.Details,
                ["leaveScreenCount"] = result.LeaveScreenCount,
                ["totalQuestions"] = totalQuestions,
                ["answeredQuestions"] = answeredQuestions,
                ["correctAnswers"] = result.Details.Count(d => d.Correct),
                ["userId"] = result.UserId
            };
            await _db.Collection("exam_results").AddAsync(firebaseData);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[WARNING] Không thể lưu vào Firebase: {ex.Message}");
        }

        _results.Add(result);
        return result;
    }

    private async Task SaveToFirestoreAsync(ExamResult result)
    {
        var data = new Dictionary<string, object?>
        {
            ["userName"] = result.UserName,
            ["userEmail"] = result.UserEmail,
            ["userStudentId"] = result.UserStudentId,
            ["testName"] = result.TestName,
            ["testId"] = result.TestId,
            ["score"] = result.Score,
            ["submittedAt"] = result.SubmittedAt,
            ["status"] = result.Status,
            ["details"] = result.Details,
            ["leaveScreenCount"] = result.LeaveScreenCount,
            ["userId"] = result.UserId
        };
        await _db.Collection("exam_results").AddAsync(data);
    }

    private static void EnsureOptionsHaveIds(QuestionInTest question)
    {
        if (question.Options == null) return;
        for (var i = 0; i < question.Options.Count; i++)
        {
            if (string.IsNullOrEmpty(question.Options[i].Id))
                question.Options[i].Id = $"opt_{i}";
        }
    }

    private static bool CheckAnswerCorrect(string? questionType, HashSet<string> correctOptionIds, HashSet<string> userOptionIds)
    {
        questionType = (questionType ?? "single").ToLowerInvariant();
        if (correctOptionIds.Count == 0 || userOptionIds.Count == 0) return false;

        return questionType switch
        {
            "multiple" or "multiple_choice" => correctOptionIds.SetEquals(userOptionIds),
            "single" or "single_choice" or "truefalse" or "true_false" =>
                correctOptionIds.Count == 1 && userOptionIds.Count == 1 &&
                correctOptionIds.First() == userOptionIds.First(),
            _ => correctOptionIds.Count == 1 && userOptionIds.Count == 1 &&
                 correctOptionIds.First() == userOptionIds.First()
        };
    }

    private static double CalculateQuestionScore(QuestionInTest question, bool isCorrect,
        HashSet<string> correctOptionIds, HashSet<string> userOptionIds)
    {
        if (!isCorrect) return 0;
        var questionScore = question.Score ?? 1.0;
        var type = question.Type?.ToLowerInvariant() ?? "";
        if (type is "multiple" or "multiple_choice")
        {
            var incorrectSelected = userOptionIds.Count(id => !correctOptionIds.Contains(id));
            if (incorrectSelected > 0 && correctOptionIds.Count > 0)
            {
                var penalty = (double)incorrectSelected / correctOptionIds.Count;
                questionScore = Math.Max(0, questionScore * (1 - penalty));
            }
        }
        return Math.Round(questionScore * 100.0) / 100.0;
    }

    private static string CreateAnswerText(QuestionInTest question, HashSet<string> userOptionIds)
    {
        if (userOptionIds.Count == 0) return "Không trả lời";
        if (question.Options == null) return "Không trả lời";

        var parts = new List<string>();
        for (var i = 0; i < question.Options.Count; i++)
        {
            var option = question.Options[i];
            if (option.Id != null && userOptionIds.Contains(option.Id))
            {
                var letter = (char)('A' + i);
                var text = option.Text ?? $"Option {i + 1}";
                parts.Add($"{letter}. {text}");
            }
        }
        return parts.Count > 0 ? string.Join(", ", parts) : "Không trả lời";
    }
}
