using Microsoft.AspNetCore.Mvc;
using OnlineExam.Models;
using OnlineExam.Services;

namespace OnlineExam.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(UserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<User>>> GetAll()
    {
        try { return Ok(await _userService.GetAllAsync()); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy danh sách user"); return StatusCode(500); }
    }

    [HttpGet("all")]
    public async Task<ActionResult<List<Dictionary<string, object?>>>> GetAllUsers()
    {
        try
        {
            var users = await _userService.GetAllAsync();
            var userList = users.Select(user => new Dictionary<string, object?>
            {
                ["uid"] = user.Uid,
                ["email"] = user.Email,
                ["username"] = user.Username,
                ["displayName"] = $"{user.FirstName} {user.LastName}".Trim(),
                ["photoURL"] = user.ImageUrl,
                ["role"] = user.Role,
                ["phone"] = user.Phone,
                ["address"] = user.Address,
                ["bio"] = user.Bio,
                ["studentId"] = user.StudentId,
                ["major"] = user.Major,
                ["year"] = user.Year
            }).ToList();
            return Ok(userList);
        }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy danh sách users"); return StatusCode(500); }
    }

    [HttpGet("{uid}")]
    public async Task<ActionResult<User>> GetById(string uid)
    {
        if (uid == "all") return NotFound();
        try
        {
            var users = await _userService.GetAllAsync();
            var user = users.FirstOrDefault(u => u.Uid == uid);
            return user == null ? NotFound() : Ok(user);
        }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi lấy user {Uid}", uid); return StatusCode(500); }
    }

    [HttpPost]
    public async Task<ActionResult<User>> Create([FromBody] User user)
    {
        try { return Ok(await _userService.CreateAsync(user)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi tạo user"); return StatusCode(500); }
    }

    [HttpPut("{uid}")]
    public async Task<ActionResult<User>> Update(string uid, [FromBody] User user)
    {
        try { return Ok(await _userService.UpdateAsync(uid, user)); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi cập nhật user {Uid}", uid); return StatusCode(500); }
    }

    [HttpDelete("{uid}")]
    public async Task<IActionResult> Delete(string uid)
    {
        try { await _userService.DeleteAsync(uid); return NoContent(); }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi xóa user {Uid}", uid); return StatusCode(500); }
    }

    [HttpPatch("{uid}/role")]
    public async Task<ActionResult<User>> ChangeRole(string uid, [FromBody] Dictionary<string, string> body)
    {
        try
        {
            var role = body.GetValueOrDefault("role");
            var user = await _userService.ChangeRoleAsync(uid, role!);
            return user == null ? NotFound() : Ok(user);
        }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi đổi role user {Uid}", uid); return StatusCode(500); }
    }

    [HttpPatch("{uid}/disable")]
    public async Task<ActionResult<User>> DisableUser(string uid, [FromBody] Dictionary<string, bool> body)
    {
        try
        {
            var isDeleted = body.GetValueOrDefault("isDeleted");
            var user = await _userService.DisableUserAsync(uid, isDeleted);
            return user == null ? NotFound() : Ok(user);
        }
        catch (Exception ex) { _logger.LogError(ex, "Lỗi khi vô hiệu hóa user {Uid}", uid); return StatusCode(500); }
    }
}
