namespace OnlineExam.Models;

public class Conversation
{
    public string? Id { get; set; }
    public List<string>? Participants { get; set; }
    public string? LastMessage { get; set; }
    public DateTime? LastMessageTime { get; set; }
    public string? LastSenderId { get; set; }
    public int UnreadCount { get; set; }
    public DateTime? CreatedAt { get; set; }
}
