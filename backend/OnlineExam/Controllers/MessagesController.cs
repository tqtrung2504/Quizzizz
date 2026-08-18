using Microsoft.AspNetCore.Mvc;
using OnlineExam.Models;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/messages")]
public class MessagesController : ControllerBase
{
    private readonly MessageService _messageService;
    private readonly UserService _userService;

    public MessagesController(MessageService messageService, UserService userService)
    {
        _messageService = messageService;
        _userService = userService;
    }

    [HttpPost("send")]
    public async Task<ActionResult<string>> SendMessage([FromBody] Dictionary<string, string> request)
    {
        try
        {
            if (!request.TryGetValue("senderId", out var senderId) ||
                !request.TryGetValue("receiverId", out var receiverId) ||
                !request.TryGetValue("content", out var content) ||
                string.IsNullOrWhiteSpace(content))
                return BadRequest("Thiếu thông tin gửi tin nhắn");

            await _messageService.SendMessageAsync(senderId, receiverId, content.Trim());
            return Ok("Đã gửi tin nhắn thành công");
        }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500, "Lỗi khi gửi tin nhắn"); }
    }

    [HttpGet("conversation/{conversationId}")]
    public async Task<ActionResult<List<Message>>> GetMessages(string conversationId)
    {
        try { return Ok(await _messageService.GetMessagesAsync(conversationId)); }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500); }
    }

    [HttpGet("conversations/{userId}")]
    public async Task<ActionResult<List<Conversation>>> GetUserConversations(string userId)
    {
        try { return Ok(await _messageService.GetUserConversationsAsync(userId)); }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500); }
    }

    [HttpPut("conversation/{conversationId}/read/{userId}")]
    public async Task<ActionResult<string>> MarkMessagesAsRead(string conversationId, string userId)
    {
        try { await _messageService.MarkMessagesAsReadAsync(conversationId, userId); return Ok("Đã đánh dấu tin nhắn đã đọc"); }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500, "Lỗi khi đánh dấu tin nhắn đã đọc"); }
    }

    [HttpGet("unread-count/{userId}")]
    public async Task<ActionResult<Dictionary<string, int>>> GetUnreadCount(string userId)
    {
        try { return Ok(new Dictionary<string, int> { ["unreadCount"] = await _messageService.GetUnreadCountAsync(userId) }); }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500); }
    }

    [HttpGet("find-user/{email}")]
    public async Task<ActionResult<Dictionary<string, object?>>> FindUserByEmail(string email)
    {
        try
        {
            var normalized = email.ToLowerInvariant().Trim();
            var userId = await _userService.FindUserIdByEmailAsync(normalized);
            if (userId != null)
                return Ok(new Dictionary<string, object?> { ["found"] = true, ["userId"] = userId, ["email"] = normalized });
            return Ok(new Dictionary<string, object?> { ["found"] = false, ["message"] = "Không tìm thấy người dùng với email này" });
        }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500); }
    }

    [HttpGet("user-info/{userId}")]
    public async Task<ActionResult<Dictionary<string, object?>>> GetUserInfo(string userId)
    {
        try { return Ok(await _userService.GetUserInfoAsync(userId)); }
        catch (Exception ex) { Console.Error.WriteLine($"Lỗi: {ex.Message}"); return StatusCode(500); }
    }
}
