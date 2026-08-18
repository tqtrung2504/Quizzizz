using Microsoft.AspNetCore.Mvc;
using OnlineExam.Models;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/exam-results")]
public class ExamResultsController : ControllerBase
{
    private readonly ExamResultService _service;
    private readonly ILogger<ExamResultsController> _logger;

    public ExamResultsController(ExamResultService service, ILogger<ExamResultsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<ExamResult>>> GetAllResults()
    {
        try { return Ok(await _service.GetAllResultsFromFirebaseAsync()); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy exam results"); return StatusCode(500); }
    }

    [HttpPost]
    public async Task<IActionResult> SaveResult([FromBody] ExamResult result)
    {
        try { await _service.SaveResultAsync(result); return Ok(); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lưu exam result"); return StatusCode(500, "Lỗi khi lưu kết quả thi!"); }
    }

    [HttpPost("submit-and-get-result")]
    public async Task<ActionResult<ExamResult>> SubmitAndGetResult([FromBody] ExamResult result)
    {
        try
        {
            _logger.LogInformation("Nhận yêu cầu nộp bài thi từ user: {User}, test: {Test}", result.UserName, result.TestName);
            var calculated = await _service.CalculateAndSaveResultAsync(result);
            return Ok(calculated);
        }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi xử lý nộp bài thi"); return StatusCode(500); }
    }

    [HttpGet("attempt-count/{userId}/{testId}")]
    public async Task<ActionResult<int>> GetAttemptCount(string userId, string testId)
    {
        try { return Ok(await _service.GetAttemptCountByUserIdAsync(userId, testId)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy số lượt thi"); return StatusCode(500); }
    }

    [HttpGet("can-take-test/{userId}/{testId}/{maxRetake}")]
    public async Task<ActionResult<bool>> CanTakeTest(string userId, string testId, int maxRetake)
    {
        try { return Ok(await _service.CanTakeTestByUserIdAsync(userId, testId, maxRetake)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi kiểm tra quyền thi"); return StatusCode(500); }
    }

    [HttpGet("attempt-count-by-user/{userId}/{testId}")]
    public async Task<ActionResult<int>> GetAttemptCountByUserId(string userId, string testId)
    {
        try { return Ok(await _service.GetAttemptCountByUserIdAsync(userId, testId)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy số lượt thi theo userId"); return StatusCode(500); }
    }

    [HttpGet("can-take-test-by-user/{userId}/{testId}/{maxRetake}")]
    public async Task<ActionResult<bool>> CanTakeTestByUserId(string userId, string testId, int maxRetake)
    {
        try { return Ok(await _service.CanTakeTestByUserIdAsync(userId, testId, maxRetake)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi kiểm tra quyền thi theo userId"); return StatusCode(500); }
    }
}
