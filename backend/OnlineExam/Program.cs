using DotNetEnv;
using Google.Cloud.Firestore;
using OnlineExam.Configuration;
using OnlineExam.Services;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

var firebaseSettings = builder.Configuration.GetSection("Firebase").Get<FirebaseSettings>()
    ?? new FirebaseSettings();

if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("FIREBASE_PROJECT_ID")))
    firebaseSettings.ProjectId = Environment.GetEnvironmentVariable("FIREBASE_PROJECT_ID")!;

if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("FIREBASE_REALTIME_DATABASE_URL")))
    firebaseSettings.RealtimeDatabaseUrl = Environment.GetEnvironmentVariable("FIREBASE_REALTIME_DATABASE_URL")!;

var (firestore, realtimeDb, _) = FirebaseInitializer.Initialize(firebaseSettings);

builder.Services.AddSingleton(firestore);
builder.Services.AddSingleton(realtimeDb);
builder.Services.AddSingleton(firebaseSettings);

builder.Services.AddSingleton<NotificationService>();
builder.Services.AddSingleton<NotificationQueryService>();
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<CourseService>();
builder.Services.AddSingleton<QuestionBankService>();
builder.Services.AddSingleton<QuestionService>();
builder.Services.AddSingleton<PartService>();
builder.Services.AddSingleton<ExamResultService>();
builder.Services.AddSingleton<ExamSessionService>();
builder.Services.AddSingleton<ExamTimeService>();
builder.Services.AddSingleton<MessageService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://daln.admin-api.site")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetPreflightMaxAge(TimeSpan.FromHours(1));
    });
});

var app = builder.Build();

app.UseCors();
app.MapControllers();

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Urls.Add($"http://0.0.0.0:{port}");

app.Run();
