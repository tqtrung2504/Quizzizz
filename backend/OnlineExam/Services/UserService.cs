using Google.Cloud.Firestore;
using OnlineExam.Models;

namespace OnlineExam.Services;

public class UserService
{
    private const string CollectionName = "users";
    private readonly FirestoreDb _db;

    public UserService(FirestoreDb db) => _db = db;

    public async Task<List<User>> GetAllAsync()
    {
        var snapshot = await _db.Collection(CollectionName).GetSnapshotAsync();
        return snapshot.Documents.Select(d => { var u = d.ConvertTo<User>(); u.Uid = d.Id; return u; }).ToList();
    }

    public async Task<User> CreateAsync(User user)
    {
        var docRef = await _db.Collection(CollectionName).AddAsync(user);
        user.Uid = docRef.Id;
        await docRef.SetAsync(user);
        return user;
    }

    public async Task<User> UpdateAsync(string uid, User user)
    {
        await _db.Collection(CollectionName).Document(uid).SetAsync(user);
        user.Uid = uid;
        return user;
    }

    public async Task DeleteAsync(string uid) =>
        await _db.Collection(CollectionName).Document(uid).DeleteAsync();

    public async Task<User?> ChangeRoleAsync(string uid, string role)
    {
        var docRef = _db.Collection(CollectionName).Document(uid);
        await docRef.UpdateAsync("role", role);
        var snap = await docRef.GetSnapshotAsync();
        if (!snap.Exists) return null;
        var user = snap.ConvertTo<User>();
        user.Uid = snap.Id;
        return user;
    }

    public async Task<User?> DisableUserAsync(string uid, bool isDeleted)
    {
        var docRef = _db.Collection(CollectionName).Document(uid);
        await docRef.UpdateAsync("isDeleted", isDeleted);
        var snap = await docRef.GetSnapshotAsync();
        if (!snap.Exists) return null;
        var user = snap.ConvertTo<User>();
        user.Uid = snap.Id;
        return user;
    }

    public async Task<string?> FindUserIdByEmailAsync(string email)
    {
        try
        {
            var query = _db.Collection(CollectionName).WhereEqualTo("email", email.ToLowerInvariant().Trim());
            var snapshot = await query.GetSnapshotAsync();
            return snapshot.Documents.FirstOrDefault()?.Id;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi tìm user theo email: {ex.Message}");
            return null;
        }
    }

    public async Task<Dictionary<string, object?>> GetUserInfoAsync(string userId)
    {
        try
        {
            var snap = await _db.Collection(CollectionName).Document(userId).GetSnapshotAsync();
            var info = new Dictionary<string, object?>();
            if (snap.Exists)
            {
                info["uid"] = snap.Id;
                info["email"] = snap.GetValue<string>("email");
                info["username"] = snap.GetValue<string>("username");
                info["displayName"] = snap.GetValue<string>("displayName");
                info["photoURL"] = snap.GetValue<string>("photoURL");
                info["role"] = snap.GetValue<string>("role");
                info["phone"] = snap.GetValue<string>("phone");
                info["address"] = snap.GetValue<string>("address");
                info["bio"] = snap.GetValue<string>("bio");
                info["studentId"] = snap.GetValue<string>("studentId");
                info["major"] = snap.GetValue<string>("major");
                info["year"] = snap.GetValue<string>("year");
            }
            return info;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi lấy thông tin user: {ex.Message}");
            return new Dictionary<string, object?>();
        }
    }
}
