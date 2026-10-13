using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using GymApp.Api.Features.Auth.Login;
using GymApp.Api.Features.Exercises.GetExerciseHistory;
using GymApp.Api.Features.Students.GetActiveRoutine;
using GymApp.Api.Features.Workouts.SyncWorkoutSessions;
using Xunit;

namespace GymApp.Api.Tests;

public class WorkoutFlowIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public WorkoutFlowIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsStudentAsync()
    {
        var loginRequest = new LoginRequest("alumno@gymapp.com", "Alumno123!");
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        response.EnsureSuccessStatusCode();

        var authResult = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(authResult);
        return authResult.Token;
    }

    [Fact]
    public async Task Login_WithInvalidPassword_Returns401Unauthorized()
    {
        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest("alumno@gymapp.com", "WrongPassword!"));

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsJwtTokenAndProfile()
    {
        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest("alumno@gymapp.com", "Alumno123!"));

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal("alumno@gymapp.com", result.User.Email);
        Assert.Equal("STUDENT", result.User.Role);
        Assert.NotNull(result.User.StudentId);
    }

    [Fact]
    public async Task GetActiveRoutine_WhenAuthenticated_ReturnsRoutineDaysAndExercises()
    {
        // Arrange
        var token = await AuthenticateAsStudentAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/students/me/routine");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var routine = await response.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(routine);
        Assert.Equal("Fuerza e Hipertrofia 2 Días", routine.Title);
        Assert.Equal(2, routine.Days.Count);

        var dayA = routine.Days.First(d => d.Name.Contains("Día A"));
        Assert.Equal(3, dayA.Exercises.Count);

        // Verificar que el press de banca tiene precargado el historial previo
        var bench = dayA.Exercises.First(e => e.Name.Contains("Press de Banca"));
        Assert.NotNull(bench.PreviousSession);
        Assert.True(bench.PreviousSession.Sets.Count > 0);
    }

    [Fact]
    public async Task SyncWorkoutSessions_AndIdempotencyRetries_BehavesCorrectly()
    {
        // Arrange
        var token = await AuthenticateAsStudentAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Obtener la rutina activa para obtener IDs válidos
        var routineResponse = await _client.GetAsync("/api/students/me/routine");
        var routine = await routineResponse.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(routine);

        var dayA = routine.Days.First();
        var exercise = dayA.Exercises.First();

        var idempotencyKey = Guid.NewGuid();
        var batchRequest = new SyncWorkoutBatchRequest(
            new List<WorkoutSessionPayload>
            {
                new(
                    IdempotencyKey: idempotencyKey,
                    RoutineDayId: dayA.Id,
                    StartedAt: DateTimeOffset.UtcNow.AddMinutes(-50),
                    CompletedAt: DateTimeOffset.UtcNow,
                    RpeScore: 8,
                    StudentNotes: "Sesión completada en gimnasio sin señal.",
                    Sets: new List<WorkoutSetLogPayload>
                    {
                        new(exercise.ExerciseId, SetNumber: 1, ActualReps: 8, ActualWeightKg: 72.5m, IsCompleted: true),
                        new(exercise.ExerciseId, SetNumber: 2, ActualReps: 8, ActualWeightKg: 72.5m, IsCompleted: true)
                    }
                )
            }
        );

        // 1. Primera sincronización (creación normal)
        var firstResponse = await _client.PostAsJsonAsync("/api/workouts/sync", batchRequest);
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);

        var firstResult = await firstResponse.Content.ReadFromJsonAsync<SyncWorkoutBatchResponse>();
        Assert.NotNull(firstResult);
        Assert.Equal(1, firstResult.SyncedCount);
        Assert.Equal("CREATED", firstResult.Results.First().Status);

        // 2. Segunda sincronización con la MISMA clave de idempotencia (simulación de reintento por corte de red)
        var secondResponse = await _client.PostAsJsonAsync("/api/workouts/sync", batchRequest);
        Assert.Equal(HttpStatusCode.OK, secondResponse.StatusCode);

        var secondResult = await secondResponse.Content.ReadFromJsonAsync<SyncWorkoutBatchResponse>();
        Assert.NotNull(secondResult);
        Assert.Equal(0, secondResult.SyncedCount); // No se vuelven a insertar filas duplicadas
        Assert.Equal("ALREADY_EXISTS", secondResult.Results.First().Status);
    }

    [Fact]
    public async Task GetExerciseHistory_ReturnsInlineLogsForStudent()
    {
        // Arrange
        var token = await AuthenticateAsStudentAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var routineResponse = await _client.GetAsync("/api/students/me/routine");
        var routine = await routineResponse.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(routine);

        var benchExercise = routine.Days.First().Exercises.First(e => e.Name.Contains("Press de Banca"));

        // Act
        var response = await _client.GetAsync($"/api/exercises/{benchExercise.ExerciseId}/history");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var history = await response.Content.ReadFromJsonAsync<ExerciseHistoryResponse>();
        Assert.NotNull(history);
        Assert.Equal(benchExercise.ExerciseId, history.ExerciseId);
        Assert.True(history.Logs.Count > 0);
    }
}
