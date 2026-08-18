using Microsoft.AspNetCore.Mvc;
using OnlineExam.Models;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/question-banks")]
public class QuestionBanksController : ControllerBase
{
    private readonly QuestionBankService _service;
    private readonly ILogger<QuestionBanksController> _logger;

    public QuestionBanksController(QuestionBankService service, ILogger<QuestionBanksController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<QuestionBank>>> GetAll(
        [FromQuery] string? search, [FromQuery] string? courseId)
    {
        try { return Ok(await _service.GetAllAsync(search, courseId)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy question banks"); return StatusCode(500); }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<QuestionBank>> GetById(string id)
    {
        try
        {
            var qb = await _service.GetByIdAsync(id);
            return qb == null ? NotFound() : Ok(qb);
        }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy question bank {Id}", id); return StatusCode(500); }
    }

    [HttpPost]
    public async Task<ActionResult<QuestionBank>> Create([FromBody] QuestionBank qb)
    {
        try { return Ok(await _service.CreateAsync(qb)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi tạo question bank"); return StatusCode(500, "Lỗi server!"); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<QuestionBank>> Update(string id, [FromBody] QuestionBank qb)
    {
        try { return Ok(await _service.UpdateAsync(id, qb)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi cập nhật question bank {Id}", id); return StatusCode(500, "Lỗi server!"); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        try { await _service.DeleteAsync(id); return NoContent(); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi xóa question bank {Id}", id); return StatusCode(500); }
    }
}
