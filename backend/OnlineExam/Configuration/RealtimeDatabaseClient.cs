using Firebase.Database;
using Firebase.Database.Query;
using Google.Apis.Auth.OAuth2;

namespace OnlineExam.Configuration;

public class RealtimeDatabaseClient
{
    private readonly FirebaseClient _client;
    private readonly string _baseUrl;

    public RealtimeDatabaseClient(GoogleCredential credential, string databaseUrl)
    {
        _baseUrl = databaseUrl.TrimEnd('/');
        _client = new FirebaseClient(_baseUrl, new FirebaseOptions
        {
            AuthTokenAsyncFactory = async () =>
            {
                var scoped = credential.CreateScoped("https://www.googleapis.com/auth/firebase.database");
                return await scoped.UnderlyingCredential.GetAccessTokenForRequestAsync();
            }
        });
    }

    public ChildQuery Child(string path) => _client.Child(path);

    public async Task<T?> GetAsync<T>(string path)
    {
        try
        {
            return await _client.Child(path).OnceSingleAsync<T>();
        }
        catch
        {
            return default;
        }
    }

    public async Task SetAsync<T>(string path, T value) =>
        await _client.Child(path).PutAsync(value);

    public async Task UpdateAsync(string path, object data) =>
        await _client.Child(path).PatchAsync(data);

    public async Task DeleteAsync(string path) =>
        await _client.Child(path).DeleteAsync();

    public async Task<string> PushAsync<T>(string path, T value)
    {
        var result = await _client.Child(path).PostAsync(value);
        return result.Key ?? Guid.NewGuid().ToString();
    }
}
