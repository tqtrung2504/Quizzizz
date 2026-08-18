using Google.Cloud.Firestore;
using OnlineExam.Models;

namespace OnlineExam.Services;

public class CourseService
{
    private const string CollectionName = "courses";
    private readonly FirestoreDb _db;
    private readonly NotificationService _notificationService;

    public CourseService(FirestoreDb db, NotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async Task<List<Course>> GetAllCoursesAsync()
    {
        var snapshot = await _db.Collection(CollectionName).GetSnapshotAsync();
        return snapshot.Documents.Select(d => { var c = d.ConvertTo<Course>(); c.Id = d.Id; return c; }).ToList();
    }

    public async Task<Course?> GetCourseByIdAsync(string courseId)
    {
        var snap = await _db.Collection(CollectionName).Document(courseId).GetSnapshotAsync();
        if (!snap.Exists) return null;
        var course = snap.ConvertTo<Course>();
        course.Id = snap.Id;
        return course;
    }

    public async Task<Course> CreateCourseAsync(Course course)
    {
        var docRef = _db.Collection(CollectionName).Document();
        course.Id = docRef.Id;
        await docRef.SetAsync(course);
        return course;
    }

    public async Task<Course> UpdateCourseAsync(string courseId, Course courseDetails)
    {
        courseDetails.Id = courseId;
        await _db.Collection(CollectionName).Document(courseId).SetAsync(courseDetails);
        return courseDetails;
    }

    public async Task DeleteCourseAsync(string courseId) =>
        await _db.Collection(CollectionName).Document(courseId).DeleteAsync();

    public async Task<List<string>> GetStudentsOfCourseAsync(string courseId)
    {
        var course = await GetCourseByIdAsync(courseId);
        return course?.Students ?? new List<string>();
    }

    public async Task AddStudentToCourseAsync(string courseId, string studentId)
    {
        var course = await GetCourseByIdAsync(courseId);
        if (course == null) return;

        course.Students ??= new List<string>();
        if (course.Students.Contains(studentId)) return;

        course.Students.Add(studentId);
        await _db.Collection(CollectionName).Document(courseId).SetAsync(course);

        try
        {
            await PushNotificationForAddedToCourseAsync(course, studentId);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi push notification cho student được thêm vào course: {ex.Message}");
        }
    }

    public async Task RemoveStudentFromCourseAsync(string courseId, string studentId)
    {
        var course = await GetCourseByIdAsync(courseId);
        if (course?.Students == null || !course.Students.Contains(studentId)) return;

        course.Students.Remove(studentId);
        await _db.Collection(CollectionName).Document(courseId).SetAsync(course);
    }

    public async Task<string?> FindUserIdByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var snapshot = await _db.Collection("users").WhereEqualTo("email", normalized).GetSnapshotAsync();
        return snapshot.Documents.FirstOrDefault()?.Id;
    }

    public async Task AddStudentToCourseByEmailOrUidAsync(string courseId, string emailOrUid)
    {
        var cleaned = emailOrUid.Trim().Trim('"');
        var userId = cleaned;

        if (userId.Contains('@'))
        {
            var foundId = await FindUserIdByEmailAsync(userId);
            if (foundId == null)
            {
                Console.Error.WriteLine($"[CourseService] Không tìm thấy user với email: {userId}");
                return;
            }
            userId = foundId;
        }

        var user = await GetUserByIdAsync(userId);
        if (user == null)
        {
            Console.Error.WriteLine($"[CourseService] UserId không hợp lệ hoặc không tồn tại: {userId}");
            return;
        }

        await AddStudentToCourseAsync(courseId, userId);
    }

    private async Task PushNotificationForAddedToCourseAsync(Course course, string studentId)
    {
        var user = await GetUserByIdAsync(studentId);
        var userName = "Sinh viên";
        if (user != null)
        {
            if (!string.IsNullOrEmpty(user.FirstName) && !string.IsNullOrEmpty(user.LastName))
                userName = $"{user.FirstName} {user.LastName}";
            else if (!string.IsNullOrEmpty(user.FirstName))
                userName = user.FirstName;
            else if (!string.IsNullOrEmpty(user.Username))
                userName = user.Username;
        }

        var title = "Đã được thêm vào lớp";
        var message = $"Xin chào {userName}! Bạn đã được thêm vào lớp \"{course.Name}\"";
        _notificationService.PushNotificationToUser(studentId, title, message, "course_added", course.Id);
    }

    private async Task<User?> GetUserByIdAsync(string userId)
    {
        var snap = await _db.Collection("users").Document(userId).GetSnapshotAsync();
        if (!snap.Exists) return null;
        var user = snap.ConvertTo<User>();
        user.Uid = snap.Id;
        return user;
    }
}
