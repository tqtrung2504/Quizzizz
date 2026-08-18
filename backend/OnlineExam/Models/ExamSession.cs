namespace OnlineExam.Models;

public class ExamSession
{
    public string? Id { get; set; }
    public string? PartId { get; set; }
    public string? UserEmail { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Status { get; set; }
    public int? RemainingTime { get; set; }
    public Dictionary<string, object>? Answers { get; set; }
}
