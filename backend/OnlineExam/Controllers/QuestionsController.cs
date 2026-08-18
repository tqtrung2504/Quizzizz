using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Mvc;
using OnlineExam.Models;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/questions")]
public class QuestionsController : ControllerBase
{
    private readonly QuestionService _service;
    private readonly FirestoreDb _db;
    private readonly ILogger<QuestionsController> _logger;

    public QuestionsController(QuestionService service, FirestoreDb db, ILogger<QuestionsController> logger)
    {
        _service = service;
        _db = db;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<Question>> Create([FromBody] Question question)
    {
        try { return Ok(await _service.CreateAsync(question)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi tạo question"); return StatusCode(500, "Lỗi server!"); }
    }

    [HttpGet]
    public async Task<ActionResult<List<Question>>> GetAll([FromQuery] string questionBankId)
    {
        try { return Ok(await _service.GetAllAsync(questionBankId)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy questions"); return StatusCode(500); }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Question>> GetById(string id)
    {
        try
        {
            var question = await _service.GetByIdAsync(id);
            return question == null ? NotFound() : Ok(question);
        }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy question {Id}", id); return StatusCode(500); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Question>> Update(string id, [FromBody] Question question)
    {
        try { return Ok(await _service.UpdateAsync(id, question)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi cập nhật question {Id}", id); return StatusCode(500, "Lỗi khi cập nhật câu hỏi!"); }
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] string id, [FromQuery] string questionBankId)
    {
        try { await _service.DeleteAsync(id, questionBankId); return NoContent(); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi xóa question"); return StatusCode(500, "Lỗi khi xóa câu hỏi!"); }
    }

    [HttpGet("test-create-and-update")]
    public async Task<ActionResult<string>> TestCreateAndUpdate()
    {
        var docRef = _db.Collection("questions").Document();
        var id = docRef.Id;
        var data = new Dictionary<string, object?>
        {
            ["content"] = "Câu hỏi mẫu tự động?",
            ["type"] = "multiple",
            ["level"] = "easy",
            ["options"] = new[]
            {
                new Dictionary<string, object?> { ["text"] = "1", ["correct"] = false },
                new Dictionary<string, object?> { ["text"] = "2", ["correct"] = true },
                new Dictionary<string, object?> { ["text"] = "3", ["correct"] = false },
                new Dictionary<string, object?> { ["text"] = "4", ["correct"] = true }
            },
            ["questionBankId"] = "gNkQmiR3ZTr5LjyfZGXX",
            ["id"] = id
        };
        await docRef.SetAsync(data);
        data["content"] = "Câu hỏi đã sửa tự động!";
        await docRef.SetAsync(data);
        return Ok($"Tạo và sửa câu hỏi thành công với id: {id}");
    }
}
