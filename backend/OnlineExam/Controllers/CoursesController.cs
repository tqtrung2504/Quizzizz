using Microsoft.AspNetCore.Mvc;
using OnlineExam.Models;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/courses")]
public class CoursesController : ControllerBase
{
    private readonly CourseService _courseService;
    private readonly ILogger<CoursesController> _logger;

    public CoursesController(CourseService courseService, ILogger<CoursesController> logger)
    {
        _courseService = courseService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<Course>>> GetAllCourses()
    {
        try { return Ok(await _courseService.GetAllCoursesAsync()); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy danh sách courses"); return StatusCode(500); }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Course>> GetCourseById(string id)
    {
        try
        {
            var course = await _courseService.GetCourseByIdAsync(id);
            return course == null ? NotFound() : Ok(course);
        }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy course {Id}", id); return StatusCode(500); }
    }

    [HttpPost]
    public async Task<ActionResult<Course>> CreateCourse([FromBody] Course course)
    {
        try { return Ok(await _courseService.CreateCourseAsync(course)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi tạo course"); return StatusCode(500); }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Course>> UpdateCourse(string id, [FromBody] Course courseDetails)
    {
        try { return Ok(await _courseService.UpdateCourseAsync(id, courseDetails)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi cập nhật course {Id}", id); return StatusCode(500); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCourse(string id)
    {
        try { await _courseService.DeleteCourseAsync(id); return NoContent(); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi xóa course {Id}", id); return StatusCode(500); }
    }

    [HttpGet("{id}/students")]
    public async Task<ActionResult<List<string>>> GetStudentsOfCourse(string id)
    {
        try { return Ok(await _courseService.GetStudentsOfCourseAsync(id)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy sinh viên course {Id}", id); return StatusCode(500); }
    }

    [HttpPost("{id}/students")]
    public async Task<IActionResult> AddStudentToCourse(string id, [FromBody] string studentIdOrEmail)
    {
        try { await _courseService.AddStudentToCourseByEmailOrUidAsync(id, studentIdOrEmail); return Ok(); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi thêm sinh viên course {Id}", id); return StatusCode(500); }
    }

    [HttpDelete("{id}/students/{studentId}")]
    public async Task<IActionResult> RemoveStudentFromCourse(string id, string studentId)
    {
        try { await _courseService.RemoveStudentFromCourseAsync(id, studentId); return NoContent(); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi xóa sinh viên course {Id}", id); return StatusCode(500); }
    }
}
