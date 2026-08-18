using Google.Cloud.Firestore;
using OnlineExam.Models;

namespace OnlineExam.Services;

public class ExamTimeService
{
    private const string PartsCollection = "parts";
    private const string ExamResultsCollection = "examResults";
    private readonly FirestoreDb _db;

    public ExamTimeService(FirestoreDb db) => _db = db;

    public Dictionary<string, object?> GetCurrentTimeInfo()
    {
        var now = DateTime.UtcNow;
        return new Dictionary<string, object?>
        {
            ["currentTime"] = now,
            ["timestamp"] = new DateTimeOffset(now).ToUnixTimeMilliseconds(),
            ["formattedTime"] = FormatDateTime(now)
        };
    }

    public async Task<Dictionary<string, object?>> GetTimeStatusAsync(string partId)
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
            status["timeStatus"] = "NO_TIME_LIMIT";
            status["status"] = "AVAILABLE";
            status["message"] = "Bài thi không có giới hạn thời gian";
            status["canStart"] = true;
        }
        else if (now < openTime)
        {
            var untilOpen = (long)(openTime.Value - now).TotalMilliseconds;
            status["timeStatus"] = "NOT_OPENED";
            status["status"] = "WAITING";
            status["message"] = "Chưa đến thời gian mở đề thi";
            status["canStart"] = false;
            status["timeUntilOpen"] = untilOpen;
            status["formattedTimeUntilOpen"] = FormatTimeRemaining(untilOpen);
        }
        else if (now > closeTime)
        {
            status["timeStatus"] = "CLOSED";
            status["status"] = "EXPIRED";
            status["message"] = "Đã quá thời gian dự thi";
            status["canStart"] = false;
        }
        else
        {
            var remaining = (long)(closeTime.Value - now).TotalMilliseconds;
            status["timeStatus"] = "OPEN";
            status["status"] = "AVAILABLE";
            status["message"] = "Có thể bắt đầu làm bài";
            status["canStart"] = true;
            status["timeRemaining"] = remaining;
            status["formattedTimeRemaining"] = FormatTimeRemaining(remaining);
        }

        return status;
    }

    public async Task<Dictionary<string, object?>> GetCountdownAsync(string partId)
    {
        var timeStatus = await GetTimeStatusAsync(partId);
        var timeStatusStr = timeStatus["timeStatus"]?.ToString() ?? "";
        var countdown = new Dictionary<string, object?>
        {
            ["partId"] = partId,
            ["timeStatus"] = timeStatusStr
        };

        switch (timeStatusStr)
        {
            case "NOT_OPENED":
                countdown["targetTime"] = timeStatus["openTime"];
                countdown["remainingTime"] = timeStatus["timeUntilOpen"];
                countdown["formattedRemaining"] = timeStatus["formattedTimeUntilOpen"];
                countdown["message"] = "Thời gian còn lại đến khi mở đề thi";
                break;
            case "OPEN":
                countdown["targetTime"] = timeStatus["closeTime"];
                countdown["remainingTime"] = timeStatus["timeRemaining"];
                countdown["formattedRemaining"] = timeStatus["formattedTimeRemaining"];
                countdown["message"] = "Thời gian còn lại để làm bài";
                break;
            case "CLOSED":
                countdown["remainingTime"] = 0L;
                countdown["formattedRemaining"] = "00:00:00";
                countdown["message"] = "Đã hết thời gian làm bài";
                break;
            default:
                countdown["remainingTime"] = null;
                countdown["formattedRemaining"] = "N/A";
                countdown["message"] = "Không có giới hạn thời gian";
                break;
        }

        return countdown;
    }

    public async Task<Dictionary<string, object?>> CanTakeExamAsync(string partId, string userEmail)
    {
        var timeStatus = await GetTimeStatusAsync(partId);
        var canStartByTime = timeStatus["canStart"] is true;

        var result = new Dictionary<string, object?>
        {
            ["partId"] = partId,
            ["canTakeByTime"] = canStartByTime,
            ["timeStatus"] = timeStatus
        };

        if (!canStartByTime)
        {
            result["canTake"] = false;
            result["reason"] = timeStatus["message"];
            return result;
        }

        var part = await GetPartByIdAsync(partId);
        if (part.MaxRetake is > 0)
        {
            var attempts = await GetCurrentAttemptsAsync(partId, userEmail);
            if (attempts >= part.MaxRetake)
            {
                result["canTake"] = false;
                result["reason"] = "Bạn đã hết số lần làm bài cho phép!";
                result["currentAttempts"] = attempts;
                result["maxRetake"] = part.MaxRetake;
                return result;
            }
            result["currentAttempts"] = attempts;
            result["maxRetake"] = part.MaxRetake;
        }

        result["canTake"] = true;
        result["reason"] = "Có thể làm bài";
        return result;
    }

    public async Task<Dictionary<string, object?>> GetExamsByTimeStatusAsync(string? status, string? courseId)
    {
        Query query = string.IsNullOrWhiteSpace(courseId)
            ? _db.Collection(PartsCollection)
            : _db.Collection(PartsCollection).WhereEqualTo("courseId", courseId);

        var snapshot = await query.GetSnapshotAsync();
        var now = DateTime.UtcNow;
        var available = new List<Dictionary<string, object?>>();
        var waiting = new List<Dictionary<string, object?>>();
        var expired = new List<Dictionary<string, object?>>();
        var noTimeLimit = new List<Dictionary<string, object?>>();

        foreach (var doc in snapshot.Documents)
        {
            var part = doc.ConvertTo<Part>();
            part.Id = doc.Id;
            var examInfo = BuildExamInfo(part);
            var openTime = part.OpenTime?.ToDateTime();
            var closeTime = part.CloseTime?.ToDateTime();

            if (openTime == null || closeTime == null)
            {
                examInfo["timeStatus"] = "NO_TIME_LIMIT";
                examInfo["status"] = "AVAILABLE";
                noTimeLimit.Add(examInfo);
            }
            else if (now < openTime)
            {
                examInfo["timeStatus"] = "NOT_OPENED";
                examInfo["status"] = "WAITING";
                examInfo["timeUntilOpen"] = (long)(openTime.Value - now).TotalMilliseconds;
                examInfo["formattedTimeUntilOpen"] = FormatTimeRemaining((long)(openTime.Value - now).TotalMilliseconds);
                waiting.Add(examInfo);
            }
            else if (now > closeTime)
            {
                examInfo["timeStatus"] = "CLOSED";
                examInfo["status"] = "EXPIRED";
                expired.Add(examInfo);
            }
            else
            {
                examInfo["timeStatus"] = "OPEN";
                examInfo["status"] = "AVAILABLE";
                examInfo["timeRemaining"] = (long)(closeTime.Value - now).TotalMilliseconds;
                examInfo["formattedTimeRemaining"] = FormatTimeRemaining((long)(closeTime.Value - now).TotalMilliseconds);
                available.Add(examInfo);
            }
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            return status.ToUpperInvariant() switch
            {
                "AVAILABLE" => new Dictionary<string, object?> { ["exams"] = available.Concat(noTimeLimit).ToList(), ["currentTime"] = now },
                "WAITING" => new Dictionary<string, object?> { ["exams"] = waiting, ["currentTime"] = now },
                "EXPIRED" => new Dictionary<string, object?> { ["exams"] = expired, ["currentTime"] = now },
                "NO_TIME_LIMIT" => new Dictionary<string, object?> { ["exams"] = noTimeLimit, ["currentTime"] = now },
                _ => BuildFullResult(available, waiting, expired, noTimeLimit, now)
            };
        }

        return BuildFullResult(available, waiting, expired, noTimeLimit, now);
    }

    private static Dictionary<string, object?> BuildFullResult(
        List<Dictionary<string, object?>> available,
        List<Dictionary<string, object?>> waiting,
        List<Dictionary<string, object?>> expired,
        List<Dictionary<string, object?>> noTimeLimit,
        DateTime now) => new()
    {
        ["availableExams"] = available,
        ["waitingExams"] = waiting,
        ["expiredExams"] = expired,
        ["noTimeLimitExams"] = noTimeLimit,
        ["currentTime"] = now
    };

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

    private static string FormatDateTime(DateTime date) =>
        date.ToString("dd/MM/yyyy HH:mm:ss");

    private static string FormatTimeRemaining(long milliseconds)
    {
        if (milliseconds <= 0) return "00:00:00";
        var seconds = milliseconds / 1000;
        var hours = seconds / 3600;
        var minutes = (seconds % 3600) / 60;
        var secs = seconds % 60;
        return $"{hours:D2}:{minutes:D2}:{secs:D2}";
    }
}
