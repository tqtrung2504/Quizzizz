using Microsoft.AspNetCore.Mvc;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/exam-time")]
public class ExamTimeController : ControllerBase
{
    private readonly ExamTimeService _service;
    private readonly ILogger<ExamTimeController> _logger;

    public ExamTimeController(ExamTimeService service, ILogger<ExamTimeController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("current")]
    public ActionResult<Dictionary<string, object?>> GetCurrentTime()
    {
        try { return Ok(_service.GetCurrentTimeInfo()); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy thời gian hiện tại"); return StatusCode(500, new Dictionary<string, object?> { ["error"] = "Lỗi server" }); }
    }

    [HttpGet("{partId}/time-status")]
    public async Task<ActionResult<Dictionary<string, object?>>> GetTimeStatus(string partId)
    {
        try { return Ok(await _service.GetTimeStatusAsync(partId)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi kiểm tra time status {PartId}", partId); return StatusCode(500, new Dictionary<string, object?> { ["error"] = "Lỗi server" }); }
    }

    [HttpGet("{partId}/countdown")]
    public async Task<ActionResult<Dictionary<string, object?>>> GetCountdown(string partId)
    {
        try { return Ok(await _service.GetCountdownAsync(partId)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy countdown {PartId}", partId); return StatusCode(500, new Dictionary<string, object?> { ["error"] = "Lỗi server" }); }
    }

    [HttpGet("{partId}/can-take")]
    public async Task<ActionResult<Dictionary<string, object?>>> CanTakeExam(string partId, [FromQuery] string userEmail)
    {
        try { return Ok(await _service.CanTakeExamAsync(partId, userEmail)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi kiểm tra can-take {PartId}", partId); return StatusCode(500, new Dictionary<string, object?> { ["error"] = "Lỗi server" }); }
    }

    [HttpGet("by-status")]
    public async Task<ActionResult<Dictionary<string, object?>>> GetExamsByTimeStatus(
        [FromQuery] string? status, [FromQuery] string? courseId)
    {
        try { return Ok(await _service.GetExamsByTimeStatusAsync(status, courseId)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy exams by status"); return StatusCode(500, new Dictionary<string, object?> { ["error"] = "Lỗi server" }); }
    }
}
