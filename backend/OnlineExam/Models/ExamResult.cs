namespace OnlineExam.Models;

public class ExamResult
{
    public string? Id { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string? UserStudentId { get; set; }
    public string? TestName { get; set; }
    public string? TestId { get; set; }
    public double Score { get; set; }
    public string? SubmittedAt { get; set; }
    public string? Status { get; set; }
    public List<ExamResultDetail>? Details { get; set; }
    public int LeaveScreenCount { get; set; }
    public string? UserId { get; set; }
}

public class ExamResultDetail
{
    public string? QuestionId { get; set; }
    public string? Question { get; set; }
    public string? Answer { get; set; }
    public string? OptionIds { get; set; }
    public bool Correct { get; set; }
    public double Point { get; set; }
}
