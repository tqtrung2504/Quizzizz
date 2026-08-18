namespace OnlineExam.Models;

public class Message
{
    public string? Id { get; set; }
    public string? ConversationId { get; set; }
    public string? SenderId { get; set; }
    public string? Content { get; set; }
    public DateTime? Timestamp { get; set; }
    public bool IsRead { get; set; }
    public string? SenderName { get; set; }
    public string? SenderEmail { get; set; }
}
