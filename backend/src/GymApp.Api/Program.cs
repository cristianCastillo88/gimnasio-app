using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using GymApp.Api.Common.Auth;
using GymApp.Api.Common.Email;
using GymApp.Api.Common.Security;
using GymApp.Api.Database;
using GymApp.Api.Features.Auth.Login;
using GymApp.Api.Features.Auth.Activation;
using GymApp.Api.Features.Auth.ChangePassword;
using GymApp.Api.Features.Auth.PasswordReset;
using GymApp.Api.Features.Exercises.GetExerciseHistory;
using GymApp.Api.Features.Students.GetActiveRoutine;
using GymApp.Api.Features.Trainer.Exercises;
using GymApp.Api.Features.Trainer.Progress;
using GymApp.Api.Features.Trainer.Routines;
using GymApp.Api.Features.Trainer.Students;
using GymApp.Api.Features.Workouts.SyncWorkoutSessions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// OWASP A02: Ocultar encabezados de huella digital de Kestrel
builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
});

// 1. Base de Datos PostgreSQL con EF Core 10 (en producción y desarrollo normal)
if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<GymAppDbContext>(options =>
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        options.UseNpgsql(connectionString);
    });
}

// 2. Soporte nativo RFC 9457 ProblemDetails y Contexto HTTP
builder.Services.AddProblemDetails();
builder.Services.AddHttpContextAccessor();

// 3. Validaciones con FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// 4. Servicio de tokens JWT, Correo, Auditoría de Seguridad y Handlers de casos de uso (Vertical Slices)
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ISecurityAuditLogger, SecurityAuditLogger>();
builder.Services.AddScoped<IEmailSender, EmailSender>();

// Handlers - Módulo Auth / Security
builder.Services.AddScoped<ILoginHandler, LoginHandler>();
builder.Services.AddScoped<IVerifyActivationTokenHandler, VerifyActivationTokenHandler>();
builder.Services.AddScoped<IActivateAccountHandler, ActivateAccountHandler>();
builder.Services.AddScoped<IChangePasswordHandler, ChangePasswordHandler>();
builder.Services.AddScoped<IForgotPasswordHandler, ForgotPasswordHandler>();
builder.Services.AddScoped<IVerifyResetTokenHandler, VerifyResetTokenHandler>();
builder.Services.AddScoped<IResetPasswordHandler, ResetPasswordHandler>();

// Handlers - Módulo Student / Workouts
builder.Services.AddScoped<IGetActiveRoutineHandler, GetActiveRoutineHandler>();
builder.Services.AddScoped<IGetExerciseHistoryHandler, GetExerciseHistoryHandler>();
builder.Services.AddScoped<ISyncWorkoutSessionsHandler, SyncWorkoutSessionsHandler>();

// Handlers - Módulo Trainer
builder.Services.AddScoped<IGetTrainerStudentsHandler, GetTrainerStudentsHandler>();
builder.Services.AddScoped<ICreateStudentHandler, CreateStudentHandler>();
builder.Services.AddScoped<IUpdateStudentSubscriptionHandler, UpdateStudentSubscriptionHandler>();
builder.Services.AddScoped<IRegenerateActivationTokenHandler, RegenerateActivationTokenHandler>();
builder.Services.AddScoped<IGetTrainerExercisesHandler, GetTrainerExercisesHandler>();
builder.Services.AddScoped<ICreateExerciseHandler, CreateExerciseHandler>();
builder.Services.AddScoped<IUpdateExerciseHandler, UpdateExerciseHandler>();
builder.Services.AddScoped<ICreateRoutineTemplateHandler, CreateRoutineTemplateHandler>();
builder.Services.AddScoped<IGetRoutineTemplateByIdHandler, GetRoutineTemplateByIdHandler>();
builder.Services.AddScoped<IUpdateRoutineTemplateHandler, UpdateRoutineTemplateHandler>();
builder.Services.AddScoped<IGetTrainerRoutinesHandler, GetTrainerRoutinesHandler>();
builder.Services.AddScoped<IDuplicateRoutineTemplateHandler, DuplicateRoutineTemplateHandler>();
builder.Services.AddScoped<IDeleteRoutineTemplateHandler, DeleteRoutineTemplateHandler>();

builder.Services.AddScoped<IAssignRoutineHandler, AssignRoutineHandler>();
builder.Services.AddScoped<IGetStudentWorkoutsHandler, GetStudentWorkoutsHandler>();

// 5. Autenticación y Autorización JWT Bearer (OWASP A04 / A07)
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"];
if (builder.Environment.IsProduction() && (string.IsNullOrWhiteSpace(jwtSecretKey) || jwtSecretKey.Length < 32))
{
    throw new InvalidOperationException("CRITICAL OWASP A04/A07 ERROR: 'Jwt:SecretKey' must be configured in production with at least 32 characters (256 bits).");
}
jwtSecretKey ??= "GymApp_Super_Secret_Key_For_Development_Environment_2026_Minimum_32_Chars!";

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "GymAppApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "GymAppClient";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// 6. OpenAPI nativo de .NET 10 para Scalar
builder.Services.AddOpenApi();

// 7. Configuración de CORS dinámica y segura (OWASP A02)
var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
var allowedOrigins = (configuredOrigins != null && configuredOrigins.Length > 0)
    ? configuredOrigins
    : new[] { "http://localhost:5173", "http://localhost:4173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 8. Rate Limiting nativo .NET 10 para mitigación de fuerza bruta y DDoS (OWASP A01 / A06)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/problem+json";
        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc6585#section-4",
            Title = "Demasiadas peticiones",
            Status = StatusCodes.Status429TooManyRequests,
            Detail = "Has superado el límite de intentos permitidos. Por favor espera un momento antes de reintentar.",
            Instance = context.HttpContext.Request.Path
        };
        await context.HttpContext.Response.WriteAsJsonAsync(
            problem,
            type: typeof(ProblemDetails),
            options: null,
            contentType: "application/problem+json",
            cancellationToken: cancellationToken);
    };

    // Política estricta para autenticación y activación (5 peticiones por minuto por IP)
    options.AddPolicy("AuthPolicy", httpContext =>
    {
        if (builder.Environment.IsEnvironment("Testing") && !httpContext.Request.Headers.ContainsKey("X-Test-RateLimit"))
        {
            return RateLimitPartition.GetNoLimiter("testing-unlimited");
        }

        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });

    // Limitador global para todas las peticiones generales (100 peticiones por minuto por IP)
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        if (builder.Environment.IsEnvironment("Testing"))
        {
            return RateLimitPartition.GetNoLimiter("testing-unlimited");
        }

        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                QueueLimit = 0
            });
    });
});

var app = builder.Build();

// Pipeline HTTP con Hardening de Seguridad
app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseSecurityHeaders();
app.UseCors("AllowClient");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "GymApp API Reference - .NET 10";
        options.Theme = ScalarTheme.Purple;
    });

    // Sembrar datos iniciales en desarrollo de forma segura
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<GymAppDbContext>();
    try
    {
        if (await db.Database.CanConnectAsync())
        {
            await db.Database.MigrateAsync();
            await DatabaseSeeder.SeedAsync(db);
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "No se pudo conectar a la base de datos para sembrar datos en el arranque.");
    }
}

// Endpoint de Healthcheck
app.MapGet("/health", async Task<IResult> (GymAppDbContext dbContext) =>
{
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        return canConnect
            ? TypedResults.Ok(new { status = "Healthy", database = "Connected", timestamp = DateTimeOffset.UtcNow })
            : TypedResults.Ok(new { status = "Degraded", database = "Disconnected", timestamp = DateTimeOffset.UtcNow });
    }
    catch (Exception ex)
    {
        return TypedResults.Ok(new { status = "Degraded", error = ex.Message, timestamp = DateTimeOffset.UtcNow });
    }
})
.WithName("GetHealth")
.WithSummary("Verifica el estado del servicio y conexión a la base de datos.")
.WithTags("System");

// Mapeo de Vertical Slices - Auth & Student
app.MapLoginEndpoint();
app.MapActivationEndpoints();
app.MapChangePasswordEndpoint();
app.MapPasswordResetEndpoints();
app.MapGetActiveRoutineEndpoint();
app.MapGetExerciseHistoryEndpoint();
app.MapSyncWorkoutEndpoint();

// Mapeo de Vertical Slices - Trainer
app.MapTrainerStudentEndpoints();
app.MapTrainerExerciseEndpoints();
app.MapTrainerRoutineEndpoints();
app.MapTrainerProgressEndpoints();

app.Run();

// Exportar clase Program para pruebas de integración con WebApplicationFactory
public partial class Program { }
