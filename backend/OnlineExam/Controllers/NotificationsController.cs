using Microsoft.AspNetCore.Mvc;
using OnlineExam.Models;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _notificationService;
    private readonly NotificationQueryService _queryService;

    public NotificationsController(NotificationService notificationService, NotificationQueryService queryService)
    {
        _notificationService = notificationService;
        _queryService = queryService;
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<Notification>>> GetUserNotifications(string userId)
    {
        try { return Ok(await _queryService.GetUserNotificationsAsync(userId)); }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi khi lấy notifications: {ex.Message}"); return StatusCode(500); }
    }

    [HttpPut("user/{userId}/notification/{notificationId}/read")]
    public ActionResult<string> MarkNotificationAsRead(string userId, string notificationId)
    {
        try { _notificationService.MarkNotificationAsRead(userId, notificationId); return Ok("Đã đánh dấu notification đã đọc"); }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500); }
    }

    [HttpDelete("user/{userId}/notification/{notificationId}")]
    public ActionResult<string> DeleteNotification(string userId, string notificationId)
    {
        try { _notificationService.DeleteNotification(userId, notificationId); return Ok("Đã xóa notification"); }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500); }
    }

    [HttpPut("user/{userId}/read-all")]
    public async Task<ActionResult<string>> MarkAllNotificationsAsRead(string userId)
    {
        try
        {
            var notifications = await _queryService.GetUserNotificationsAsync(userId);
            foreach (var n in notifications.Where(n => !n.IsRead))
                _notificationService.MarkNotificationAsRead(userId, n.Id!);
            return Ok("Đã đánh dấu tất cả notifications đã đọc");
        }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500); }
    }

    [HttpGet("user/{userId}/unread-count")]
    public async Task<ActionResult<Dictionary<string, int>>> GetUnreadCount(string userId)
    {
        try
        {
            var notifications = await _queryService.GetUserNotificationsAsync(userId);
            return Ok(new Dictionary<string, int> { ["unreadCount"] = notifications.Count(n => !n.IsRead) });
        }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500); }
    }
}
