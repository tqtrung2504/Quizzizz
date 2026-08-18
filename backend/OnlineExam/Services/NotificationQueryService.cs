using OnlineExam.Configuration;
using OnlineExam.Models;

namespace OnlineExam.Services;

public class NotificationQueryService
{
    private readonly RealtimeDatabaseClient _db;

    public NotificationQueryService(RealtimeDatabaseClient db) => _db = db;

    public async Task<List<Notification>> GetUserNotificationsAsync(string userId)
    {
        try
        {
            var data = await _db.GetAsync<Dictionary<string, Dictionary<string, object>>>(
                $"notifications/{userId}");

            if (data == null) return new List<Notification>();

            var notifications = data.Select(kvp =>
            {
                var notification = ParseNotification(kvp.Value);
                notification.Id = kvp.Key;
                return notification;
            }).ToList();

            return notifications
                .OrderByDescending(n => n.CreatedAt ?? DateTime.MinValue)
                .ToList();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[NotificationController] Lỗi khi lấy notifications: {ex.Message}");
            return new List<Notification>();
        }
    }

    private static Notification ParseNotification(Dictionary<string, object> data)
    {
        return new Notification
        {
            Id = data.GetValueOrDefault("id")?.ToString(),
            UserId = data.GetValueOrDefault("userId")?.ToString(),
            Title = data.GetValueOrDefault("title")?.ToString(),
            Message = data.GetValueOrDefault("message")?.ToString(),
            Type = data.GetValueOrDefault("type")?.ToString(),
            RelatedId = data.GetValueOrDefault("relatedId")?.ToString(),
            IsRead = ParseBool(data.GetValueOrDefault("isRead")),
            CreatedAt = ParseTimestamp(data.GetValueOrDefault("createdAt")),
            ReadAt = ParseTimestamp(data.GetValueOrDefault("readAt"))
        };
    }

    private static bool ParseBool(object? value) => value switch
    {
        bool b => b,
        string s => bool.TryParse(s, out var r) && r,
        _ => false
    };

    private static DateTime? ParseTimestamp(object? value) => value switch
    {
        long l => DateTimeOffset.FromUnixTimeMilliseconds(l).UtcDateTime,
        int i => DateTimeOffset.FromUnixTimeMilliseconds(i).UtcDateTime,
        double d => DateTimeOffset.FromUnixTimeMilliseconds((long)d).UtcDateTime,
        _ => null
    };
}
