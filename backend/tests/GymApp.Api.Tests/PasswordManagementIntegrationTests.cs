using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using GymApp.Api.Database;
using GymApp.Api.Database.Entities;
using GymApp.Api.Features.Auth.ChangePassword;
using GymApp.Api.Features.Auth.Login;
using GymApp.Api.Features.Auth.PasswordReset;
using GymApp.Api.Features.Trainer.Students;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GymApp.Api.Tests;

public class PasswordManagementIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PasswordManagementIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ChangePassword_WithValidCurrentPassword_ChangesPasswordSuccessfully()
    {
        // 1. Iniciar sesión como alumno existente
        var loginRes = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "alumno@gymapp.com",
            "Alumno123!"
        ));
        loginRes.EnsureSuccessStatusCode();
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);

        var authenticatedClient = _factory.CreateClient();
        authenticatedClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth.Token);

        // 2. Cambiar contraseña a una nueva válida OWASP
        var changeRes = await authenticatedClient.PostAsJsonAsync("/api/auth/change-password", new ChangePasswordRequest(
            "Alumno123!",
            "NuevaClaveSegura2026!"
        ));
        changeRes.EnsureSuccessStatusCode();

        // 3. Verificar que ya no se puede ingresar con la clave vieja
        var oldLoginRes = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "alumno@gymapp.com",
            "Alumno123!"
        ));
        Assert.Equal(HttpStatusCode.Unauthorized, oldLoginRes.StatusCode);

        // 4. Verificar que se puede ingresar con la clave nueva
        var newLoginRes = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "alumno@gymapp.com",
            "NuevaClaveSegura2026!"
        ));
        newLoginRes.EnsureSuccessStatusCode();

        // Restaurar contraseña original para no afectar otros tests
        var restoreClient = _factory.CreateClient();
        var newAuth = await newLoginRes.Content.ReadFromJsonAsync<AuthResponse>();
        restoreClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", newAuth!.Token);
        var restoreRes = await restoreClient.PostAsJsonAsync("/api/auth/change-password", new ChangePasswordRequest(
            "NuevaClaveSegura2026!",
            "Alumno123!"
        ));
        restoreRes.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task ChangePassword_WithInvalidCurrentPassword_Returns401Unauthorized()
    {
        // 1. Iniciar sesión como alumno
        var loginRes = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "alumno@gymapp.com",
            "Alumno123!"
        ));
        loginRes.EnsureSuccessStatusCode();
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);

        var authenticatedClient = _factory.CreateClient();
        authenticatedClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth.Token);

        // 2. Intentar cambiar con contraseña actual incorrecta (retorna 401 Unauthorized)
        var changeRes = await authenticatedClient.PostAsJsonAsync("/api/auth/change-password", new ChangePasswordRequest(
            "ClaveIncorrecta999!",
            "NuevaClaveSegura2026!"
        ));
        Assert.Equal(HttpStatusCode.Unauthorized, changeRes.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_WithWeakNewPassword_ReturnsValidationProblem()
    {
        var loginRes = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "alumno@gymapp.com",
            "Alumno123!"
        ));
        loginRes.EnsureSuccessStatusCode();
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);

        var authenticatedClient = _factory.CreateClient();
        authenticatedClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth.Token);

        // Contraseña débil (sin símbolos ni números)
        var changeRes = await authenticatedClient.PostAsJsonAsync("/api/auth/change-password", new ChangePasswordRequest(
            "Alumno123!",
            "simple"
        ));
        Assert.Equal(HttpStatusCode.BadRequest, changeRes.StatusCode);
    }

    [Fact]
    public async Task ResetStudentPasswordToken_AsTrainer_GeneratesNewCsprngToken()
    {
        // 1. Iniciar sesión como Entrenador
        var loginRes = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "trainer@gymapp.com",
            "Trainer123!"
        ));
        loginRes.EnsureSuccessStatusCode();
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(auth);

        var trainerClient = _factory.CreateClient();
        trainerClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", auth.Token);

        // 2. Obtener lista de alumnos para tomar uno
        var studentsRes = await trainerClient.GetAsync("/api/trainer/students");
        studentsRes.EnsureSuccessStatusCode();
        var students = await studentsRes.Content.ReadFromJsonAsync<List<StudentSummaryDto>>();
        Assert.NotNull(students);
        Assert.NotEmpty(students);

        var targetStudent = students.First();

        // 3. Solicitar regeneración de token de restablecimiento
        var resetTokenRes = await trainerClient.PostAsync(
            $"/api/trainer/students/{targetStudent.Id}/reset-password-token",
            null
        );
        resetTokenRes.EnsureSuccessStatusCode();
        var tokenResult = await resetTokenRes.Content.ReadFromJsonAsync<RegenerateActivationTokenResponse>();
        Assert.NotNull(tokenResult);
        Assert.False(string.IsNullOrWhiteSpace(tokenResult.ActivationToken));
        Assert.Equal(64, tokenResult.ActivationToken.Length);
        Assert.Matches("^[a-f0-9]{64}$", tokenResult.ActivationToken);
    }

    [Fact]
    public async Task ForgotPassword_AntiEnumeration_ReturnsOkForBothExistingAndNonExistingEmails()
    {
        // Correo existente
        var resExisting = await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest(
            "trainer@gymapp.com"
        ));
        resExisting.EnsureSuccessStatusCode();
        var bodyExisting = await resExisting.Content.ReadFromJsonAsync<ForgotPasswordResponse>();
        Assert.NotNull(bodyExisting);
        Assert.Contains("instrucciones para restablecer la contraseña", bodyExisting.Message);

        // Correo inexistente (debe dar exactamente la misma respuesta neutra sin filtrar existencia)
        var resNonExisting = await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest(
            "noexiste_totalmente_falso_999@gymapp.com"
        ));
        resNonExisting.EnsureSuccessStatusCode();
        var bodyNonExisting = await resNonExisting.Content.ReadFromJsonAsync<ForgotPasswordResponse>();
        Assert.NotNull(bodyNonExisting);
        Assert.Equal(bodyExisting.Message, bodyNonExisting.Message);
    }

    [Fact]
    public async Task TrainerForgotPassword_FullFlow_SucceedsAndAllowsLogin()
    {
        // 1. Solicitar recuperación para trainer
        var forgotRes = await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequest(
            "trainer@gymapp.com"
        ));
        forgotRes.EnsureSuccessStatusCode();

        // 2. Consultar token generado directamente en la BD de prueba
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GymAppDbContext>();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == "trainer@gymapp.com");
        Assert.NotNull(user);
        Assert.NotNull(user.PasswordResetToken);
        var token = user.PasswordResetToken;

        // 3. Verificar validez del token
        var verifyRes = await _client.GetAsync($"/api/auth/verify-reset-token?token={token}");
        verifyRes.EnsureSuccessStatusCode();
        var verifyData = await verifyRes.Content.ReadFromJsonAsync<VerifyResetTokenResponse>();
        Assert.NotNull(verifyData);
        Assert.Equal("trainer@gymapp.com", verifyData.Email);

        // 4. Restablecer contraseña con el token
        var resetRes = await _client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequest(
            token,
            "NuevaClaveTrainer2026!"
        ));
        resetRes.EnsureSuccessStatusCode();
        var authData = await resetRes.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(authData);
        Assert.Equal("TRAINER", authData.User.Role);

        // 5. Iniciar sesión con la nueva contraseña
        var newLogin = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "trainer@gymapp.com",
            "NuevaClaveTrainer2026!"
        ));
        newLogin.EnsureSuccessStatusCode();

        // Restaurar clave original del trainer
        var authRestored = await newLogin.Content.ReadFromJsonAsync<AuthResponse>();
        var restoreClient = _factory.CreateClient();
        restoreClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", authRestored!.Token);
        var restoreRes = await restoreClient.PostAsJsonAsync("/api/auth/change-password", new ChangePasswordRequest(
            "NuevaClaveTrainer2026!",
            "Trainer123!"
        ));
        restoreRes.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task VerifyResetToken_WithInvalidOrExpiredToken_ReturnsNotFound()
    {
        var invalidToken = "token_invalido_de_prueba_123456789";
        var res = await _client.GetAsync($"/api/auth/verify-reset-token?token={invalidToken}");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }
}
