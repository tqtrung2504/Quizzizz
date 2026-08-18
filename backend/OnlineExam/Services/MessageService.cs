using OnlineExam.Configuration;
using OnlineExam.Models;

namespace OnlineExam.Services;

public class MessageService
{
    private readonly RealtimeDatabaseClient _db;

    public MessageService(RealtimeDatabaseClient db) => _db = db;

    public async Task<string> GetOrCreateConversationAsync(string userId1, string userId2)
    {
        var sortedUsers = new List<string> { userId1, userId2 };
        sortedUsers.Sort(StringComparer.Ordinal);
        var conversationId = $"{sortedUsers[0]}_{sortedUsers[1]}";

        var existing = await _db.GetAsync<Conversation>($"conversations/{conversationId}");
        if (existing == null)
        {
            var conversation = new Conversation
            {
                Id = conversationId,
                Participants = sortedUsers,
                LastMessage = "",
                LastMessageTime = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            await _db.SetAsync($"conversations/{conversationId}", conversation);
        }

        return conversationId;
    }

    public async Task SendMessageAsync(string senderId, string receiverId, string content)
    {
        try
        {
            var conversationId = await GetOrCreateConversationAsync(senderId, receiverId);
            var messageId = await _db.PushAsync($"messages/{conversationId}", new Message
            {
                ConversationId = conversationId,
                SenderId = senderId,
                Content = content,
                Timestamp = DateTime.UtcNow,
                IsRead = false
            });

            await _db.UpdateAsync($"conversations/{conversationId}", new Dictionary<string, object?>
            {
                ["lastMessage"] = content,
                ["lastMessageTime"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                ["lastSenderId"] = senderId
            });

            await UpdateUnreadCountAsync(conversationId, receiverId, 1);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi gửi tin nhắn: {ex.Message}");
        }
    }

    public async Task<List<Message>> GetMessagesAsync(string conversationId)
    {
        try
        {
            var data = await _db.GetAsync<Dictionary<string, Message>>($"messages/{conversationId}");
            if (data == null) return new List<Message>();

            return data.Select(kvp =>
            {
                kvp.Value.Id = kvp.Key;
                return kvp.Value;
            }).OrderBy(m => m.Timestamp ?? DateTime.MinValue).ToList();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi lấy tin nhắn: {ex.Message}");
            return new List<Message>();
        }
    }

    public async Task<List<Conversation>> GetUserConversationsAsync(string userId)
    {
        try
        {
            var data = await _db.GetAsync<Dictionary<string, Conversation>>("conversations");
            if (data == null) return new List<Conversation>();

            return data
                .Where(kvp => kvp.Value.Participants?.Contains(userId) == true)
                .Select(kvp =>
                {
                    kvp.Value.Id = kvp.Key;
                    return kvp.Value;
                })
                .OrderByDescending(c => c.LastMessageTime ?? DateTime.MinValue)
                .ToList();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi lấy conversations: {ex.Message}");
            return new List<Conversation>();
        }
    }

    public async Task MarkMessagesAsReadAsync(string conversationId, string userId)
    {
        try
        {
            var messages = await GetMessagesAsync(conversationId);
            foreach (var message in messages.Where(m => m.SenderId != userId && !m.IsRead))
            {
                await _db.UpdateAsync($"messages/{conversationId}/{message.Id}", new Dictionary<string, object?> { ["isRead"] = true });
            }
            await UpdateUnreadCountAsync(conversationId, userId, 0, reset: true);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi đánh dấu tin nhắn đã đọc: {ex.Message}");
        }
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        try
        {
            var data = await _db.GetAsync<Dictionary<string, Dictionary<string, int>>>("unread_counts");
            if (data == null) return 0;

            return data.Values
                .Where(v => v.ContainsKey(userId))
                .Sum(v => v[userId]);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi lấy unread count: {ex.Message}");
            return 0;
        }
    }

    private async Task UpdateUnreadCountAsync(string conversationId, string userId, int increment, bool reset = false)
    {
        try
        {
            var current = await _db.GetAsync<int?>($"unread_counts/{conversationId}/{userId}") ?? 0;
            var newCount = reset ? 0 : Math.Max(0, current + increment);
            await _db.SetAsync($"unread_counts/{conversationId}/{userId}", newCount);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Lỗi khi cập nhật unread count: {ex.Message}");
        }
    }
}
