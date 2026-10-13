using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using GymApp.Api.Features.Auth.Login;
using GymApp.Api.Features.Auth.Activation;
using GymApp.Api.Features.Students.GetActiveRoutine;
using GymApp.Api.Features.Trainer.Exercises;
using GymApp.Api.Features.Trainer.Progress;
using GymApp.Api.Features.Trainer.Routines;
using GymApp.Api.Features.Trainer.Students;
using Xunit;

namespace GymApp.Api.Tests;

public class TrainerFlowIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public TrainerFlowIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsTrainerAsync()
    {
        var loginRequest = new LoginRequest("trainer@gymapp.com", "Trainer123!");
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
        response.EnsureSuccessStatusCode();

        var authResult = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(authResult);
        return authResult.Token;
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
    public async Task GetTrainerStudents_ReturnsStudentsList()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/trainer/students");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var students = await response.Content.ReadFromJsonAsync<List<StudentSummaryDto>>();
        Assert.NotNull(students);
        Assert.NotEmpty(students);
        Assert.Contains(students, s => s.Email == "alumno@gymapp.com");
    }

    [Fact]
    public async Task CreateStudent_WithValidPayload_Returns201Created()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var newStudentRequest = new CreateStudentRequest(
            FullName: "Martin Nuevo",
            Email: $"martin_{Guid.NewGuid():N}@test.com",
            PhoneWhatsapp: "+5491133344455",
            MedicalNotes: "Apto médico presentado.",
            FitnessGoals: "Definición y fuerza.",
            SessionsRemaining: 12
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/trainer/students", newStudentRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<StudentSummaryDto>();
        Assert.NotNull(created);
        Assert.Equal(newStudentRequest.FullName, created.FullName);
        Assert.Equal(12, created.SessionsRemaining);
    }

    [Fact]
    public async Task UpdateSubscription_UpdatesStatusAndSessionsRemaining()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var studentsResponse = await _client.GetAsync("/api/trainer/students");
        var students = await studentsResponse.Content.ReadFromJsonAsync<List<StudentSummaryDto>>();
        Assert.NotNull(students);
        var student = students.First();

        var updatePayload = new UpdateSubscriptionRequest(
            SubscriptionStatus: "PENDING",
            SessionsRemainingDelta: 4,
            NextBillingDate: DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15))
        );

        // Act
        var response = await _client.PatchAsJsonAsync($"/api/trainer/students/{student.Id}/subscription", updatePayload);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<StudentSummaryDto>();
        Assert.NotNull(updated);
        Assert.Equal("PENDING", updated.SubscriptionStatus);
        Assert.Equal(student.SessionsRemaining + 4, updated.SessionsRemaining);
    }

    [Fact]
    public async Task CreateExercise_WithTipsAndVideo_PersistsInLibrary()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var newExercise = new CreateExerciseRequest(
            Name: "Hip Thrust con Barra",
            MuscleGroup: "Glúteos",
            MovementPattern: "Empuje de cadera",
            VideoUrl: "https://www.youtube.com/shorts/hipthrust",
            ExecutionTips: "Pies apoyados firmemente, bloquear cadera arriba por 1 segundo."
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/trainer/exercises", newExercise);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ExerciseDto>();
        Assert.NotNull(created);
        Assert.Equal("Hip Thrust con Barra", created.Name);
    }

    [Fact]
    public async Task CreateRoutineAndAssign_AssociatesTemplateToStudent()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var exercisesResponse = await _client.GetAsync("/api/trainer/exercises");
        var exercises = await exercisesResponse.Content.ReadFromJsonAsync<List<ExerciseDto>>();
        Assert.NotNull(exercises);
        Assert.NotEmpty(exercises);
        var firstEx = exercises.First();

        var routineRequest = new CreateRoutineTemplateRequest(
            Title: "Rutina Express 1 Día",
            Description: "Rutina de mantenimiento rápido",
            Days: new List<CreateRoutineDayDto>
            {
                new(
                    Name: "Día Único Fullbody",
                    OrderIndex: 1,
                    Exercises: new List<CreateRoutineExerciseDto>
                    {
                        new(firstEx.Id, OrderIndex: 1, TargetSets: 3, TargetReps: "10-12", SuggestedWeightKg: 40m, SuggestedRestSeconds: 90)
                    }
                )
            }
        );

        // 1. Crear plantilla
        var createResponse = await _client.PostAsJsonAsync("/api/trainer/routines", routineRequest);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var createdRoutine = await createResponse.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(createdRoutine);

        // 2. Asignar al alumno
        var studentsResponse = await _client.GetAsync("/api/trainer/students");
        var students = await studentsResponse.Content.ReadFromJsonAsync<List<StudentSummaryDto>>();
        Assert.NotNull(students);
        var student = students.First();

        var assignRequest = new AssignRoutineRequest(student.Id, createdRoutine.Id);
        var assignResponse = await _client.PostAsJsonAsync("/api/trainer/routines/assign", assignRequest);
        Assert.Equal(HttpStatusCode.OK, assignResponse.StatusCode);
        var assignResult = await assignResponse.Content.ReadFromJsonAsync<AssignRoutineResponse>();
        Assert.NotNull(assignResult);
        Assert.Contains("asignada exitosamente", assignResult.Message);
        Assert.Equal(student.Id, assignResult.StudentId);
        Assert.Equal(createdRoutine.Id, assignResult.RoutineTemplateId);
    }

    [Fact]
    public async Task CreateRoutine_WithInvalidExerciseId_Returns400BadRequestProblemDetails()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var nonExistentExerciseId = Guid.NewGuid();
        var routineRequest = new CreateRoutineTemplateRequest(
            Title: "Rutina Inválida",
            Description: "Rutina con ejercicio inexistente",
            Days: new List<CreateRoutineDayDto>
            {
                new(
                    Name: "Día 1",
                    OrderIndex: 1,
                    Exercises: new List<CreateRoutineExerciseDto>
                    {
                        new(nonExistentExerciseId, OrderIndex: 1, TargetSets: 3, TargetReps: "10", SuggestedWeightKg: 20m, SuggestedRestSeconds: 60)
                    }
                )
            }
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/trainer/routines", routineRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(400, problem.Status);
        Assert.Equal("Ejercicios inválidos", problem.Title);
        Assert.Contains(nonExistentExerciseId.ToString(), problem.Detail);
    }

    [Fact]
    public async Task GetStudentWorkouts_ReturnsCompletedSessionsWithRpeAndLoads()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var studentsResponse = await _client.GetAsync("/api/trainer/students");
        var students = await studentsResponse.Content.ReadFromJsonAsync<List<StudentSummaryDto>>();
        Assert.NotNull(students);
        var student = students.First(s => s.Email == "alumno@gymapp.com");

        // Act
        var response = await _client.GetAsync($"/api/trainer/students/{student.Id}/workouts");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var history = await response.Content.ReadFromJsonAsync<StudentWorkoutHistoryResponse>();
        Assert.NotNull(history);
        Assert.Equal(student.Id, history.StudentId);
        Assert.NotEmpty(history.Sessions);

        var session = history.Sessions.First();
        Assert.Equal(8, session.RpeScore);
        Assert.NotEmpty(session.Sets);
    }

    [Fact]
    public async Task TrainerEndpoints_WhenCalledByStudentRole_Returns403Forbidden()
    {
        // Arrange - Autenticar como Alumno
        var studentToken = await AuthenticateAsStudentAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", studentToken);

        // Act - Intentar acceder a endpoint administrativo del Trainer
        var response = await _client.GetAsync("/api/trainer/students");

        // Assert - Debe ser denegado con 403 Forbidden
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateExercise_WithValidPayload_Returns200Ok()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Crear ejercicio primero
        var createRequest = new CreateExerciseRequest(
            Name: $"Ejercicio Base {Guid.NewGuid():N}",
            MuscleGroup: "Pecho",
            MovementPattern: "Empuje",
            VideoUrl: "https://youtube.com/original",
            ExecutionTips: "Tips iniciales"
        );
        var createResponse = await _client.PostAsJsonAsync("/api/trainer/exercises", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var created = await createResponse.Content.ReadFromJsonAsync<ExerciseDto>();
        Assert.NotNull(created);

        // Act - Actualizar ejercicio
        var updateRequest = new UpdateExerciseRequest(
            Name: $"{created.Name} - Editado",
            MuscleGroup: "Hombros",
            MovementPattern: "Empuje vertical",
            VideoUrl: "https://youtube.com/updated",
            ExecutionTips: "Tips actualizados"
        );
        var updateResponse = await _client.PutAsJsonAsync($"/api/trainer/exercises/{created.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        var updated = await updateResponse.Content.ReadFromJsonAsync<ExerciseDto>();
        Assert.NotNull(updated);
        Assert.Equal(created.Id, updated.Id);
        Assert.Equal(updateRequest.Name, updated.Name);
        Assert.Equal("Hombros", updated.MuscleGroup);
        Assert.Equal("Empuje vertical", updated.MovementPattern);
        Assert.Equal("https://youtube.com/updated", updated.VideoUrl);
        Assert.Equal("Tips actualizados", updated.ExecutionTips);
    }

    [Fact]
    public async Task GetRoutineById_And_UpdateRoutine_WithValidPayload_Returns200Ok()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Obtener un ejercicio existente
        var exercisesResponse = await _client.GetAsync("/api/trainer/exercises");
        var exercises = await exercisesResponse.Content.ReadFromJsonAsync<List<ExerciseDto>>();
        Assert.NotNull(exercises);
        Assert.NotEmpty(exercises);
        var exercise = exercises.First();

        // Crear una rutina inicial
        var createRoutineRequest = new CreateRoutineTemplateRequest(
            Title: $"Rutina Inicial {Guid.NewGuid():N}",
            Description: "Planificación inicial de fuerza",
            Days: new List<CreateRoutineDayDto>
            {
                new(
                    Name: "Día 1 - Fuerza",
                    OrderIndex: 1,
                    Exercises: new List<CreateRoutineExerciseDto>
                    {
                        new(exercise.Id, OrderIndex: 1, TargetSets: 3, TargetReps: "5", SuggestedWeightKg: 80m, SuggestedRestSeconds: 120)
                    }
                )
            }
        );
        var createResponse = await _client.PostAsJsonAsync("/api/trainer/routines", createRoutineRequest);
        createResponse.EnsureSuccessStatusCode();
        var createdRoutine = await createResponse.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(createdRoutine);

        // Act 1 - GetRoutineById
        var getResponse = await _client.GetAsync($"/api/trainer/routines/{createdRoutine.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var fetchedRoutine = await getResponse.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(fetchedRoutine);
        Assert.Equal(createdRoutine.Id, fetchedRoutine.Id);
        Assert.Equal(createdRoutine.Title, fetchedRoutine.Title);

        // Act 2 - UpdateRoutine
        var updateRoutineRequest = new UpdateRoutineTemplateRequest(
            Title: $"{createdRoutine.Title} - Editada",
            Description: "Planificación ajustada a hipertrofia",
            Days: new List<CreateRoutineDayDto>
            {
                new(
                    Name: "Día A - Modificado",
                    OrderIndex: 1,
                    Exercises: new List<CreateRoutineExerciseDto>
                    {
                        new(exercise.Id, OrderIndex: 1, TargetSets: 4, TargetReps: "10-12", SuggestedWeightKg: 70m, SuggestedRestSeconds: 90)
                    }
                )
            }
        );
        var updateResponse = await _client.PutAsJsonAsync($"/api/trainer/routines/{createdRoutine.Id}", updateRoutineRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);


        var updatedRoutine = await updateResponse.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(updatedRoutine);
        Assert.Equal(createdRoutine.Id, updatedRoutine.Id);
        Assert.Equal(updateRoutineRequest.Title, updatedRoutine.Title);
        Assert.Equal("Planificación ajustada a hipertrofia", updatedRoutine.Description);
        Assert.Single(updatedRoutine.Days);
        Assert.Equal("Día A - Modificado", updatedRoutine.Days[0].Name);
        Assert.Single(updatedRoutine.Days[0].Exercises);
        Assert.Equal(4, updatedRoutine.Days[0].Exercises[0].TargetSets);
        Assert.Equal("10-12", updatedRoutine.Days[0].Exercises[0].TargetReps);
        Assert.Equal(70m, updatedRoutine.Days[0].Exercises[0].SuggestedWeightKg);
    }

    [Fact]
    public async Task DuplicateRoutine_WithValidId_Returns201CreatedAndCopiesAllDays()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var exercisesResponse = await _client.GetAsync("/api/trainer/exercises");
        var exercises = await exercisesResponse.Content.ReadFromJsonAsync<List<ExerciseDto>>();
        Assert.NotNull(exercises);
        Assert.NotEmpty(exercises);
        var exercise = exercises.First();

        var createRoutineRequest = new CreateRoutineTemplateRequest(
            Title: $"Rutina Original {Guid.NewGuid():N}",
            Description: "Plantilla original para clonar",
            Days: new List<CreateRoutineDayDto>
            {
                new(
                    Name: "Día 1 Original",
                    OrderIndex: 1,
                    Exercises: new List<CreateRoutineExerciseDto>
                    {
                        new(exercise.Id, OrderIndex: 1, TargetSets: 3, TargetReps: "8", SuggestedWeightKg: 50m, SuggestedRestSeconds: 90)
                    }
                )
            }
        );
        var createResponse = await _client.PostAsJsonAsync("/api/trainer/routines", createRoutineRequest);
        createResponse.EnsureSuccessStatusCode();
        var originalRoutine = await createResponse.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(originalRoutine);

        // Act - Duplicar rutina
        var duplicateResponse = await _client.PostAsync($"/api/trainer/routines/{originalRoutine.Id}/duplicate", null);

        // Assert
        Assert.Equal(HttpStatusCode.Created, duplicateResponse.StatusCode);
        var duplicatedRoutine = await duplicateResponse.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(duplicatedRoutine);
        Assert.NotEqual(originalRoutine.Id, duplicatedRoutine.Id);
        Assert.Equal($"{originalRoutine.Title} (Copia)", duplicatedRoutine.Title);
        Assert.Equal(originalRoutine.Description, duplicatedRoutine.Description);
        Assert.Single(duplicatedRoutine.Days);
        Assert.Equal("Día 1 Original", duplicatedRoutine.Days[0].Name);
        Assert.Single(duplicatedRoutine.Days[0].Exercises);
        Assert.Equal(3, duplicatedRoutine.Days[0].Exercises[0].TargetSets);
        Assert.Equal("8", duplicatedRoutine.Days[0].Exercises[0].TargetReps);
        Assert.Equal(50m, duplicatedRoutine.Days[0].Exercises[0].SuggestedWeightKg);
    }

    [Fact]
    public async Task DeleteRoutine_WithNoAssignedStudents_Returns204NoContent()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var exercisesResponse = await _client.GetAsync("/api/trainer/exercises");
        var exercises = await exercisesResponse.Content.ReadFromJsonAsync<List<ExerciseDto>>();
        var exercise = exercises!.First();

        var createRoutineRequest = new CreateRoutineTemplateRequest(
            Title: $"Rutina Para Borrar {Guid.NewGuid():N}",
            Description: "Plantilla temporal para test de borrado",
            Days: new List<CreateRoutineDayDto>
            {
                new(
                    Name: "Día Temporal",
                    OrderIndex: 1,
                    Exercises: new List<CreateRoutineExerciseDto>
                    {
                        new(exercise.Id, OrderIndex: 1, TargetSets: 2, TargetReps: "10", SuggestedWeightKg: 15m, SuggestedRestSeconds: 60)
                    }
                )
            }
        );
        var createResponse = await _client.PostAsJsonAsync("/api/trainer/routines", createRoutineRequest);
        createResponse.EnsureSuccessStatusCode();
        var routine = await createResponse.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(routine);

        // Act - Eliminar la rutina
        var deleteResponse = await _client.DeleteAsync($"/api/trainer/routines/{routine.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Verificar que ya no existe
        var getResponse = await _client.GetAsync($"/api/trainer/routines/{routine.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteRoutine_WithActiveAssignedStudents_Returns409Conflict()
    {
        // Arrange
        var token = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var studentsResponse = await _client.GetAsync("/api/trainer/students");
        var students = await studentsResponse.Content.ReadFromJsonAsync<List<StudentSummaryDto>>();
        var student = students!.First(s => s.Email == "alumno@gymapp.com");

        var exercisesResponse = await _client.GetAsync("/api/trainer/exercises");
        var exercises = await exercisesResponse.Content.ReadFromJsonAsync<List<ExerciseDto>>();
        var exercise = exercises!.First();

        var createRoutineRequest = new CreateRoutineTemplateRequest(
            Title: $"Rutina Asignada {Guid.NewGuid():N}",
            Description: "Plantilla con asignación activa",
            Days: new List<CreateRoutineDayDto>
            {
                new(
                    Name: "Día 1",
                    OrderIndex: 1,
                    Exercises: new List<CreateRoutineExerciseDto>
                    {
                        new(exercise.Id, OrderIndex: 1, TargetSets: 3, TargetReps: "10", SuggestedWeightKg: 20m, SuggestedRestSeconds: 60)
                    }
                )
            }
        );
        var createResponse = await _client.PostAsJsonAsync("/api/trainer/routines", createRoutineRequest);
        createResponse.EnsureSuccessStatusCode();
        var routine = await createResponse.Content.ReadFromJsonAsync<ActiveRoutineResponse>();
        Assert.NotNull(routine);

        // Asignar al alumno
        var assignRequest = new AssignRoutineRequest(student.Id, routine.Id);
        var assignResponse = await _client.PostAsJsonAsync("/api/trainer/routines/assign", assignRequest);
        assignResponse.EnsureSuccessStatusCode();

        // Act - Intentar eliminar la rutina asignada
        var deleteResponse = await _client.DeleteAsync($"/api/trainer/routines/{routine.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, deleteResponse.StatusCode);
        var problem = await deleteResponse.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(409, problem.Status);
        Assert.Contains("alumnos", problem.Detail ?? problem.Title, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateStudent_ReturnsActivationToken_AndAllowsStudentToActivateAccount()
    {
        // 1. Arrange - Entrenador autenticado
        var trainerToken = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", trainerToken);

        var uniqueEmail = $"nuevo_alumno_{Guid.NewGuid():N}@gym.com";
        var createStudentRequest = new CreateStudentRequest(
            FullName: "Mateo Activación",
            Email: uniqueEmail,
            PhoneWhatsapp: "+5491155554444",
            SessionsRemaining: 12
        );

        // 2. Act - Entrenador da de alta al alumno
        var createResponse = await _client.PostAsJsonAsync("/api/trainer/students", createStudentRequest);
        createResponse.EnsureSuccessStatusCode();
        var studentSummary = await createResponse.Content.ReadFromJsonAsync<StudentSummaryDto>();

        // Assert - Token generado y retornado en DTO
        Assert.NotNull(studentSummary);
        Assert.False(string.IsNullOrWhiteSpace(studentSummary.ActivationToken));
        var token = studentSummary.ActivationToken;

        // 3. Act - Alumno accede al link de activación sin autenticación previa
        _client.DefaultRequestHeaders.Authorization = null;
        var verifyResponse = await _client.GetAsync($"/api/auth/verify-activation-token?token={token}");

        // Assert - Token válido devuelve nombre y correo del alumno
        Assert.Equal(HttpStatusCode.OK, verifyResponse.StatusCode);
        var verifyData = await verifyResponse.Content.ReadFromJsonAsync<VerifyActivationTokenResponse>();
        Assert.NotNull(verifyData);
        Assert.Equal("Mateo Activación", verifyData.FullName);
        Assert.Equal(uniqueEmail, verifyData.Email);

        // 4. Act - Alumno elige su contraseña personal y activa su cuenta
        var activateRequest = new ActivateAccountRequest(token, "MateoSeguro2026!");
        var activateResponse = await _client.PostAsJsonAsync("/api/auth/activate-account", activateRequest);

        // Assert - Activación exitosa devuelve JWT para autologin
        Assert.Equal(HttpStatusCode.OK, activateResponse.StatusCode);
        var authResponse = await activateResponse.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(authResponse);
        Assert.False(string.IsNullOrWhiteSpace(authResponse.Token));
        Assert.Equal(uniqueEmail, authResponse.User.Email);
        Assert.Equal("STUDENT", authResponse.User.Role);

        // 5. Assert - El token usado queda invalidado (de un solo uso)
        var reuseResponse = await _client.GetAsync($"/api/auth/verify-activation-token?token={token}");
        Assert.Equal(HttpStatusCode.NotFound, reuseResponse.StatusCode);

        // 6. Assert - Alumno puede iniciar sesión normalmente con su nueva contraseña
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(uniqueEmail, "MateoSeguro2026!"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    [Fact]
    public async Task RegenerateActivationToken_ReturnsNewToken()
    {
        // Arrange
        var trainerToken = await AuthenticateAsTrainerAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", trainerToken);

        var uniqueEmail = $"alumno_regenerar_{Guid.NewGuid():N}@gym.com";
        var createStudentRequest = new CreateStudentRequest(
            FullName: "Sofia Reenvio",
            Email: uniqueEmail,
            PhoneWhatsapp: "+5491177778888",
            SessionsRemaining: 8
        );
        var createResponse = await _client.PostAsJsonAsync("/api/trainer/students", createStudentRequest);
        createResponse.EnsureSuccessStatusCode();
        var studentSummary = await createResponse.Content.ReadFromJsonAsync<StudentSummaryDto>();
        Assert.NotNull(studentSummary);
        var originalToken = studentSummary.ActivationToken;

        // Act - Entrenador solicita regenerar el enlace de activación
        var regenResponse = await _client.PostAsync($"/api/trainer/students/{studentSummary.Id}/activation-token", null);

        // Assert
        Assert.Equal(HttpStatusCode.OK, regenResponse.StatusCode);
        var regenData = await regenResponse.Content.ReadFromJsonAsync<RegenerateActivationTokenResponse>();
        Assert.NotNull(regenData);
        Assert.False(string.IsNullOrWhiteSpace(regenData.ActivationToken));
        Assert.NotEqual(originalToken, regenData.ActivationToken);
    }
}


