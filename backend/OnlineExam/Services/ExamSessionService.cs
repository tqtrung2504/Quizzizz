using Google.Cloud.Firestore;
using OnlineExam.Models;

namespace OnlineExam.Services;

public class ExamSessionService
{
    private const string PartsCollection = "parts";
    private const string ExamResultsCollection = "examResults";
    private const string ExamSessionsCollection = "examSessions";
    private readonly FirestoreDb _db;

    public ExamSessionService(FirestoreDb db) => _db = db;

    public async Task<Dictionary<string, object?>> GetExamStatusAsync(string partId)
    {
        var part = await GetPartByIdAsync(partId);
        var now = DateTime.UtcNow;
        var openTime = part.OpenTime?.ToDateTime();
        var closeTime = part.CloseTime?.ToDateTime();

        var status = new Dictionary<string, object?>
        {
            ["partId"] = partId,
            ["partName"] = part.Name,
            ["currentTime"] = now,
            ["openTime"] = openTime,
            ["closeTime"] = closeTime,
            ["duration"] = part.Duration
        };

        if (openTime == null || closeTime == null)
        {
            status["status"] = "NO_TIME_LIMIT";
            status["message"] = "Bài thi không có giới hạn thời gian";
            status["canStart"] = true;
        }
        else if (now < openTime)
        {
            status["status"] = "NOT_OPENED";
            status["message"] = "Chưa đến thời gian mở đề thi";
            status["canStart"] = false;
            status["timeUntilOpen"] = (long)(openTime.Value - now).TotalMilliseconds;
        }
        else if (now > closeTime)
        {
            status["status"] = "CLOSED";
            status["message"] = "Đã quá thời gian dự thi";
            status["canStart"] = false;
        }
        else
        {
            status["status"] = "AVAILABLE";
            status["message"] = "Có thể bắt đầu làm bài";
            status["canStart"] = true;
            status["timeRemaining"] = (long)(closeTime.Value - now).TotalMilliseconds;
        }

        return status;
    }

    public async Task<Dictionary<string, object?>> StartExamAsync(string partId, string userEmail)
    {
        var status = await GetExamStatusAsync(partId);
        if (status["canStart"] is not true)
            throw new ArgumentException(status["message"]?.ToString());

        var part = await GetPartByIdAsync(partId);
        if (part.MaxRetake is > 0)
        {
            var attempts = await GetCurrentAttemptsAsync(partId, userEmail);
            if (attempts >= part.MaxRetake)
                throw new ArgumentException("Bạn đã hết số lần làm bài cho phép!");
        }

        var startTime = DateTime.UtcNow;
        var session = new Dictionary<string, object?>
        {
            ["partId"] = partId,
            ["userEmail"] = userEmail,
            ["startTime"] = Timestamp.FromDateTime(startTime),
            ["status"] = "IN_PROGRESS"
        };

        var docRef = await _db.Collection(ExamSessionsCollection).AddAsync(session);
        var examData = PrepareExamForStudent(part);

        return new Dictionary<string, object?>
        {
            ["sessionId"] = docRef.Id,
            ["examData"] = examData,
            ["startTime"] = startTime,
            ["duration"] = part.Duration,
            ["maxRetake"] = part.MaxRetake
        };
    }

    public async Task<Dictionary<string, object?>> GetAvailableExamsAsync(string userEmail, string? courseId)
    {
        Query query = string.IsNullOrWhiteSpace(courseId)
            ? _db.Collection(PartsCollection)
            : _db.Collection(PartsCollection).WhereEqualTo("courseId", courseId);

        var snapshot = await query.GetSnapshotAsync();
        var now = DateTime.UtcNow;
        var available = new List<Dictionary<string, object?>>();
        var upcoming = new List<Dictionary<string, object?>>();
        var closed = new List<Dictionary<string, object?>>();

        foreach (var doc in snapshot.Documents)
        {
            var part = doc.ConvertTo<Part>();
            part.Id = doc.Id;
            var examInfo = BuildExamInfo(part);

            var openTime = part.OpenTime?.ToDateTime();
            var closeTime = part.CloseTime?.ToDateTime();

            if (openTime == null || closeTime == null)
            {
                examInfo["status"] = "NO_TIME_LIMIT";
                available.Add(examInfo);
            }
            else if (now < openTime)
            {
                examInfo["status"] = "NOT_OPENED";
                examInfo["timeUntilOpen"] = (long)(openTime.Value - now).TotalMilliseconds;
                upcoming.Add(examInfo);
            }
            else if (now > closeTime)
            {
                examInfo["status"] = "CLOSED";
                closed.Add(examInfo);
            }
            else
            {
                examInfo["status"] = "AVAILABLE";
                examInfo["timeRemaining"] = (long)(closeTime.Value - now).TotalMilliseconds;
                available.Add(examInfo);
            }
        }

        return new Dictionary<string, object?>
        {
            ["availableExams"] = available,
            ["upcomingExams"] = upcoming,
            ["closedExams"] = closed,
            ["currentTime"] = now
        };
    }

    public async Task<Dictionary<string, object?>> GetRemainingTimeAsync(string partId, string userEmail)
    {
        var snapshot = await _db.Collection(ExamSessionsCollection)
            .WhereEqualTo("partId", partId)
            .WhereEqualTo("userEmail", userEmail)
            .WhereEqualTo("status", "IN_PROGRESS")
            .GetSnapshotAsync();

        if (snapshot.Count == 0)
            throw new ArgumentException("Không tìm thấy phiên làm bài đang diễn ra!");

        var sessionDoc = snapshot.Documents[0];
        var startTime = sessionDoc.GetValue<Timestamp>("startTime").ToDateTime();
        var part = await GetPartByIdAsync(partId);
        var now = DateTime.UtcNow;
        var elapsed = (long)(now - startTime).TotalMilliseconds;
        var totalDuration = (part.Duration ?? 0) * 60 * 1000L;
        var remaining = totalDuration - elapsed;

        return new Dictionary<string, object?>
        {
            ["sessionId"] = sessionDoc.Id,
            ["startTime"] = startTime,
            ["elapsedTime"] = elapsed,
            ["totalDuration"] = totalDuration,
            ["remainingTime"] = Math.Max(0, remaining),
            ["isTimeUp"] = remaining <= 0
        };
    }

    public async Task<Dictionary<string, object?>> SubmitExamAsync(string partId, string userEmail, Dictionary<string, object?>? answers)
    {
        var snapshot = await _db.Collection(ExamSessionsCollection)
            .WhereEqualTo("partId", partId)
            .WhereEqualTo("userEmail", userEmail)
            .WhereEqualTo("status", "IN_PROGRESS")
            .GetSnapshotAsync();

        if (snapshot.Count == 0)
            throw new ArgumentException("Không tìm thấy phiên làm bài đang diễn ra!");

        var sessionDoc = snapshot.Documents[0];
        await sessionDoc.Reference.UpdateAsync(new Dictionary<string, object>
        {
            ["status"] = "COMPLETED",
            ["endTime"] = Timestamp.FromDateTime(DateTime.UtcNow)
        });

        var part = await GetPartByIdAsync(partId);
        var answersDict = answers ?? new Dictionary<string, object?>();
        var scoreResult = CalculateScore(part, answersDict);

        var examResult = new Dictionary<string, object?>
        {
            ["testId"] = partId,
            ["userEmail"] = userEmail,
            ["score"] = scoreResult["score"],
            ["testName"] = part.Name,
            ["submittedAt"] = DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm:ss"),
            ["status"] = "submitted",
            ["details"] = scoreResult["details"]
        };

        var resultRef = await _db.Collection(ExamResultsCollection).AddAsync(examResult);

        var response = new Dictionary<string, object?>
        {
            ["resultId"] = resultRef.Id,
            ["score"] = scoreResult["score"],
            ["totalScore"] = scoreResult["totalScore"],
            ["correctAnswers"] = scoreResult["correctAnswers"],
            ["totalQuestions"] = scoreResult["totalQuestions"],
            ["showAnswerAfterSubmit"] = part.ShowAnswerAfterSubmit
        };

        if (part.ShowAnswerAfterSubmit == true)
            response["details"] = scoreResult["details"];

        return response;
    }

    private async Task<Part> GetPartByIdAsync(string partId)
    {
        var snap = await _db.Collection(PartsCollection).Document(partId).GetSnapshotAsync();
        if (!snap.Exists) throw new ArgumentException("Bài thi không tồn tại!");
        var part = snap.ConvertTo<Part>();
        part.Id = snap.Id;
        return part;
    }

    private async Task<int> GetCurrentAttemptsAsync(string partId, string userEmail)
    {
        var snapshot = await _db.Collection(ExamResultsCollection)
            .WhereEqualTo("partId", partId)
            .WhereEqualTo("userEmail", userEmail)
            .GetSnapshotAsync();
        return snapshot.Count;
    }

    private static Dictionary<string, object?> BuildExamInfo(Part part) => new()
    {
        ["partId"] = part.Id,
        ["partName"] = part.Name,
        ["description"] = part.Description,
        ["duration"] = part.Duration,
        ["score"] = part.Score,
        ["openTime"] = part.OpenTime?.ToDateTime(),
        ["closeTime"] = part.CloseTime?.ToDateTime(),
        ["maxRetake"] = part.MaxRetake
    };

    private static Dictionary<string, object?> PrepareExamForStudent(Part part)
    {
        var examData = new Dictionary<string, object?>
        {
            ["partId"] = part.Id,
            ["partName"] = part.Name,
            ["description"] = part.Description,
            ["duration"] = part.Duration,
            ["score"] = part.Score
        };

        var questions = new List<Dictionary<string, object?>>();
        if (part.Questions != null)
        {
            var questionList = part.Questions.ToList();
            if (part.RandomizeQuestions == true)
            {
                var rng = new Random();
                questionList = questionList.OrderBy(_ => rng.Next()).ToList();
            }

            foreach (var q in questionList)
            {
                questions.Add(new Dictionary<string, object?>
                {
                    ["id"] = q.Id,
                    ["content"] = q.Content,
                    ["type"] = q.Type,
                    ["level"] = q.Level,
                    ["score"] = q.Score,
                    ["options"] = q.Options,
                    ["answer"] = null,
                    ["correctAnswers"] = null
                });
            }
        }

        examData["questions"] = questions;
        return examData;
    }

    private static Dictionary<string, object?> CalculateScore(Part part, Dictionary<string, object?> answers)
    {
        double totalScore = 0, earnedScore = 0;
        int correctAnswers = 0, totalQuestions = 0;
        var details = new List<ExamResultDetail>();

        if (part.Questions != null)
        {
            foreach (var question in part.Questions)
            {
                totalQuestions++;
                totalScore += question.Score ?? 0;
                answers.TryGetValue(question.Id!, out var userAnswer);

                var isCorrect = false;
                if (userAnswer != null)
                {
                    if (question.Type == "single_choice")
                        isCorrect = question.Answer == userAnswer.ToString();
                    else if (question.Type == "multiple_choice" && userAnswer is IEnumerable<object> userList)
                    {
                        var userAnswers = userList.Select(x => Convert.ToInt32(x)).OrderBy(x => x).ToList();
                        var correct = question.CorrectAnswers?.OrderBy(x => x).ToList() ?? new List<int>();
                        isCorrect = userAnswers.SequenceEqual(correct);
                    }
                }

                if (isCorrect)
                {
                    earnedScore += question.Score ?? 0;
                    correctAnswers++;
                }

                details.Add(new ExamResultDetail
                {
                    QuestionId = question.Id,
                    Question = question.Content,
                    Answer = userAnswer?.ToString(),
                    Correct = isCorrect,
                    Point = isCorrect ? (question.Score ?? 0) : 0
                });
            }
        }

        return new Dictionary<string, object?>
        {
            ["score"] = earnedScore,
            ["totalScore"] = totalScore,
            ["correctAnswers"] = correctAnswers,
            ["totalQuestions"] = totalQuestions,
            ["details"] = details
        };
    }
}
