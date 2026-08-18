using Microsoft.AspNetCore.Mvc;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/test")]
public class TestNotificationController : ControllerBase
{
    private readonly NotificationService _notificationService;

    public TestNotificationController(NotificationService notificationService) =>
        _notificationService = notificationService;

    [HttpPost("notification")]
    public ActionResult<Dictionary<string, object?>> TestNotification([FromBody] Dictionary<string, object?> request)
    {
        try
        {
            var userId = request.GetValueOrDefault("userId")?.ToString();
            var title = request.GetValueOrDefault("title")?.ToString();
            var message = request.GetValueOrDefault("message")?.ToString();
            var type = request.GetValueOrDefault("type")?.ToString();

            if (userId == null || title == null || message == null)
                return BadRequest(new Dictionary<string, object?> { ["success"] = false, ["message"] = "Thiếu thông tin: userId, title, message" });

            _notificationService.PushNotificationToUser(userId, title, message, type ?? "test");
            return Ok(new Dictionary<string, object?>
            {
                ["success"] = true,
                ["message"] = "Đã push notification thành công",
                ["data"] = new Dictionary<string, object?> { ["userId"] = userId, ["title"] = title, ["message"] = message, ["type"] = type ?? "test" }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new Dictionary<string, object?> { ["success"] = false, ["message"] = $"Lỗi: {ex.Message}" });
        }
    }

    [HttpPost("notification-multiple")]
    public ActionResult<Dictionary<string, object?>> TestNotificationMultiple([FromBody] Dictionary<string, object?> request)
    {
        try
        {
            var title = request.GetValueOrDefault("title")?.ToString();
            var message = request.GetValueOrDefault("message")?.ToString();
            var type = request.GetValueOrDefault("type")?.ToString();
            var userIds = ParseStringList(request.GetValueOrDefault("userIds"));

            if (userIds.Count == 0 || title == null || message == null)
                return BadRequest(new Dictionary<string, object?> { ["success"] = false, ["message"] = "Thiếu thông tin: userIds, title, message" });

            _notificationService.PushNotificationToUsers(userIds, title, message, type ?? "test");
            return Ok(new Dictionary<string, object?>
            {
                ["success"] = true,
                ["message"] = $"Đã push notification cho {userIds.Count} users"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new Dictionary<string, object?> { ["success"] = false, ["message"] = $"Lỗi: {ex.Message}" });
        }
    }

    [HttpPost("exam-notification")]
    public ActionResult<Dictionary<string, object?>> TestExamNotification([FromBody] Dictionary<string, object?> request)
    {
        try
        {
            var examName = request.GetValueOrDefault("examName")?.ToString();
            var courseName = request.GetValueOrDefault("courseName")?.ToString();
            var studentIds = ParseStringList(request.GetValueOrDefault("studentIds"));

            if (examName == null || courseName == null || studentIds.Count == 0)
                return BadRequest(new Dictionary<string, object?> { ["success"] = false, ["message"] = "Thiếu thông tin: examName, courseName, studentIds" });

            var title = "Bài thi mới";
            var message = $"Bạn có bài thi mới: \"{examName}\" trong lớp \"{courseName}\"";
            _notificationService.PushNotificationToUsers(studentIds, title, message, "exam_created", "test-exam-id");

            return Ok(new Dictionary<string, object?>
            {
                ["success"] = true,
                ["message"] = $"Đã push notification bài thi mới cho {studentIds.Count} students"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new Dictionary<string, object?> { ["success"] = false, ["message"] = $"Lỗi: {ex.Message}" });
        }
    }

    private static List<string> ParseStringList(object? value)
    {
        if (value is List<string> list) return list;
        if (value is IEnumerable<object> objects) return objects.Select(o => o.ToString()!).ToList();
        if (value is System.Text.Json.JsonElement je && je.ValueKind == System.Text.Json.JsonValueKind.Array)
            return je.EnumerateArray().Select(e => e.GetString()!).Where(s => s != null).ToList()!;
        return new List<string>();
    }
}
