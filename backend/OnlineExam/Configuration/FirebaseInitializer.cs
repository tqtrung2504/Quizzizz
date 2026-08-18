using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Firestore;

namespace OnlineExam.Configuration;

public class FirebaseSettings
{
    public string ProjectId { get; set; } = "project-quiz-1c195";
    public string RealtimeDatabaseUrl { get; set; } = "https://project-quiz-1c195-default-rtdb.asia-southeast1.firebasedatabase.app/";
}

public static class FirebaseInitializer
{
    public static (FirestoreDb Firestore, RealtimeDatabaseClient RealtimeDb, GoogleCredential Credential) Initialize(FirebaseSettings settings)
    {
        var credential = LoadCredential();

        if (FirebaseApp.DefaultInstance == null)
        {
            FirebaseApp.Create(new AppOptions
            {
                Credential = credential,
                ProjectId = settings.ProjectId
            });
        }

        var firestore = FirestoreDb.Create(settings.ProjectId);
        var realtimeDb = new RealtimeDatabaseClient(credential, settings.RealtimeDatabaseUrl);
        return (firestore, realtimeDb, credential);
    }

    private static GoogleCredential LoadCredential()
    {
        var base64 = Environment.GetEnvironmentVariable("FIREBASE_SERVICE_ACCOUNT_BASE64");

        if (!string.IsNullOrEmpty(base64))
        {
            var jsonBytes = Convert.FromBase64String(base64);
            using var stream = new MemoryStream(jsonBytes);
            return GoogleCredential.FromStream(stream);
        }

        var keyPath = Path.Combine(AppContext.BaseDirectory, "serviceAccountKey.json");
        if (!File.Exists(keyPath))
            keyPath = Path.Combine(Directory.GetCurrentDirectory(), "serviceAccountKey.json");

        if (File.Exists(keyPath))
        {
            using var stream = File.OpenRead(keyPath);
            return GoogleCredential.FromStream(stream);
        }

        throw new FileNotFoundException(
            "Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or provide serviceAccountKey.json.");
    }
}
