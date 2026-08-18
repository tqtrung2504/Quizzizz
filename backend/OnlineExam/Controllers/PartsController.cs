using Microsoft.AspNetCore.Mvc;
using OnlineExam.Models;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/parts")]
public class PartsController : ControllerBase
{
    private readonly PartService _service;
    private readonly ILogger<PartsController> _logger;

    public PartsController(PartService service, ILogger<PartsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<Part>>> GetAllParts([FromQuery] string? search)
    {
        try
        {
            if (!string.IsNullOrEmpty(search))
                return Ok(await _service.SearchPartsAsync(search));
            return Ok(await _service.GetAllPartsAsync());
        }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy parts"); return StatusCode(500); }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Part>> GetPartById(string id)
    {
        try
        {
            var part = await _service.GetPartByIdAsync(id);
            return part == null ? NotFound() : Ok(part);
        }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy part {Id}", id); return StatusCode(500); }
    }

    [HttpPost]
    public async Task<ActionResult<Part>> CreatePart([FromBody] Part part)
    {
        try { return Ok(await _service.CreatePartAsync(part)); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi tạo part"); return StatusCode(500, "Lỗi server!"); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Part>> UpdatePart(string id, [FromBody] Part part)
    {
        try { return Ok(await _service.UpdatePartAsync(id, part)); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi cập nhật part {Id}", id); return StatusCode(500, "Lỗi server!"); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePart(string id)
    {
        try { await _service.DeletePartAsync(id); return NoContent(); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi xóa part {Id}", id); return StatusCode(500); }
    }
}
