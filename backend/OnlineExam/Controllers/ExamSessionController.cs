using Microsoft.AspNetCore.Mvc;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/exam-session")]
public class ExamSessionController : ControllerBase
{
    private readonly ExamSessionService _service;
    private readonly ILogger<ExamSessionController> _logger;

    public ExamSessionController(ExamSessionService service, ILogger<ExamSessionController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("{partId}/status")]
    public async Task<ActionResult<Dictionary<string, object?>>> GetExamStatus(string partId)
    {
        try { return Ok(await _service.GetExamStatusAsync(partId)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi kiểm tra trạng thái bài thi {PartId}", partId); return StatusCode(500, new Dictionary<string, object?> { ["error"] = "Lỗi server" }); }
    }

    [HttpPost("{partId}/start")]
    public async Task<ActionResult<Dictionary<string, object?>>> StartExam(string partId, [FromBody] Dictionary<string, string> request)
    {
        try
        {
            if (!request.TryGetValue("userEmail", out var userEmail) || string.IsNullOrWhiteSpace(userEmail))
                return BadRequest(new Dictionary<string, object?> { ["error"] = "Thiếu thông tin userEmail" });
            return Ok(await _service.StartExamAsync(partId, userEmail));
        }
        catch (ArgumentException ex) { return BadRequest(new Dictionary<string, object?> { ["error"] = ex.Message }); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi bắt đầu bài thi {PartId}", partId); return StatusCode(500, new Dictionary<string, object?> { ["error"] = "Lỗi server" }); }
    }

    [HttpGet("available")]
    public async Task<ActionResult<Dictionary<string, object?>>> GetAvailableExams(
        [FromQuery] string userEmail, [FromQuery] string? courseId)
    {
        try { return Ok(await _service.GetAvailableExamsAsync(userEmail, courseId)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy bài thi có thể làm"); return StatusCode(500, new Dictionary<string, object?> { ["error"] = "Lỗi server" }); }
    }

    [HttpGet("{partId}/remaining-time")]
    public async Task<ActionResult<Dictionary<string, object?>>> GetRemainingTime(string partId, [FromQuery] string userEmail)
    {
        try { return Ok(await _service.GetRemainingTimeAsync(partId, userEmail)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi kiểm tra thời gian còn lại {PartId}", partId); return StatusCode(500, new Dictionary<string, object?> { ["error"] = "Lỗi server" }); }
    }

    [HttpPost("{partId}/submit")]
    public async Task<ActionResult<Dictionary<string, object?>>> SubmitExam(string partId, [FromBody] Dictionary<string, object?> request)
    {
        try
        {
            if (!request.TryGetValue("userEmail", out var userEmailObj) || userEmailObj?.ToString() is not { Length: > 0 } userEmail)
                return BadRequest(new Dictionary<string, object?> { ["error"] = "Thiếu thông tin userEmail" });

            Dictionary<string, object?>? answers = null;
            if (request.TryGetValue("answers", out var answersObj) && answersObj is Dictionary<string, object?> dict)
                answers = dict;
            else if (answersObj is System.Text.Json.JsonElement je && je.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                answers = je.EnumerateObject().ToDictionary(p => p.Name, p => (object?)p.Value.ToString());
            }

            return Ok(await _service.SubmitExamAsync(partId, userEmail, answers));
        }
        catch (ArgumentException ex) { return BadRequest(new Dictionary<string, object?> { ["error"] = ex.Message }); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi nộp bài thi {PartId}", partId); return StatusCode(500, new Dictionary<string, object?> { ["error"] = "Lỗi server" }); }
    }
}
