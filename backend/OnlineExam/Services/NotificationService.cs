using OnlineExam.Configuration;

namespace OnlineExam.Services;

public class NotificationService
{
    private readonly RealtimeDatabaseClient _db;

    public NotificationService(RealtimeDatabaseClient db) => _db = db;

    public void PushNotificationToUser(string userId, string title, string message, string type, string? relatedId = null)
    {
        try
        {
            var notificationId = Guid.NewGuid().ToString();
            var data = new Dictionary<string, object?>
            {
                ["id"] = notificationId,
                ["userId"] = userId,
                ["title"] = title,
                ["message"] = message,
                ["type"] = type,
                ["relatedId"] = relatedId,
                ["isRead"] = false,
                ["createdAt"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };

            _ = _db.SetAsync($"notifications/{userId}/{notificationId}", data);
            Console.WriteLine($"Đã push notification cho user {userId}: {title}");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi push notification: {ex.Message}");
        }
    }

    public void PushNotificationToUsers(List<string> userIds, string title, string message, string type, string? relatedId = null)
    {
        foreach (var userId in userIds)
            PushNotificationToUser(userId, title, message, type, relatedId);
    }

    public void MarkNotificationAsRead(string userId, string notificationId)
    {
        try
        {
            var updates = new Dictionary<string, object?>
            {
                ["isRead"] = true,
                ["readAt"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
            _ = _db.UpdateAsync($"notifications/{userId}/{notificationId}", updates);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi đánh dấu notification đã đọc: {ex.Message}");
        }
    }

    public void DeleteNotification(string userId, string notificationId)
    {
        try
        {
            _ = _db.DeleteAsync($"notifications/{userId}/{notificationId}");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi xóa notification: {ex.Message}");
        }
    }
}
