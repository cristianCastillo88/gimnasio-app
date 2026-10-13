using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using GymApp.Api.Features.Auth.Activation;
using GymApp.Api.Features.Auth.Login;
using GymApp.Api.Features.Trainer.Students;

namespace GymApp.Api.Tests;

public class SecurityHardeningIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public SecurityHardeningIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HttpResponses_IncludeOwaspSecurityHeaders()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.EnsureSuccessStatusCode();

        Assert.True(response.Headers.Contains("X-Content-Type-Options"), "Falta cabecera X-Content-Type-Options");
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").First());

        Assert.True(response.Headers.Contains("X-Frame-Options"), "Falta cabecera X-Frame-Options");
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").First());

        Assert.True(response.Headers.Contains("Referrer-Policy"), "Falta cabecera Referrer-Policy");
        Assert.Equal("strict-origin-when-cross-origin", response.Headers.GetValues("Referrer-Policy").First());

        Assert.True(response.Headers.Contains("Permissions-Policy"), "Falta cabecera Permissions-Policy");
        Assert.True(response.Headers.Contains("Content-Security-Policy"), "Falta cabecera Content-Security-Policy");

        // Cabecera Server debe ser suprimida
        Assert.False(response.Headers.Contains("Server"), "La cabecera Server no debe estar presente");
    }

    [Fact]
    public async Task CreateStudent_GeneratesCsprngToken_With64HexCharacters()
    {
        // 1. Iniciar sesión como Trainer
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "trainer@gymapp.com",
            "Trainer123!"
        ));
        loginResponse.EnsureSuccessStatusCode();
        var authResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(authResult);

        var trainerClient = _factory.CreateClient();
        trainerClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResult.Token);

        // 2. Crear alumno nuevo
        var createRequest = new CreateStudentRequest(
            "Security Test Student",
            $"csprng.student.{Guid.NewGuid():N}@test.com",
            "+54 9 11 1122-3344",
            null,
            null,
            8
        );

        var createResponse = await trainerClient.PostAsJsonAsync("/api/trainer/students", createRequest);
        createResponse.EnsureSuccessStatusCode();
        var createdStudent = await createResponse.Content.ReadFromJsonAsync<StudentSummaryDto>();

        Assert.NotNull(createdStudent);
        Assert.NotNull(createdStudent.ActivationToken);

        // Debe tener exactamente 64 caracteres (256 bits de CSPRNG en hexadecimal)
        Assert.Equal(64, createdStudent.ActivationToken.Length);
        Assert.Matches("^[0-9a-f]{64}$", createdStudent.ActivationToken);
    }

    [Fact]
    public async Task ActivateAccount_RejectsWeakPasswords_WithValidationProblem()
    {
        // 1. Obtener alumno creado con token
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "trainer@gymapp.com",
            "Trainer123!"
        ));
        var authResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        var trainerClient = _factory.CreateClient();
        trainerClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResult!.Token);

        var studentRes = await trainerClient.PostAsJsonAsync("/api/trainer/students", new CreateStudentRequest(
            "Weak Password Target",
            $"weak.pass.{Guid.NewGuid():N}@test.com",
            "+54 9 11 0000-1111",
            null,
            null,
            4
        ));
        var student = await studentRes.Content.ReadFromJsonAsync<StudentSummaryDto>();

        // 2. Probar contraseña corta / débil
        var activateResponse = await _client.PostAsJsonAsync("/api/auth/activate-account", new ActivateAccountRequest(
            student!.ActivationToken!,
            "weak123" // Menos de 8 caracteres y sin mayúscula ni símbolo
        ));

        Assert.Equal(HttpStatusCode.BadRequest, activateResponse.StatusCode);
    }

    [Fact]
    public async Task RateLimiter_AuthPolicy_EnforcesLimitAndReturns429()
    {
        // El cliente de pruebas simula peticiones seguidas al endpoint con política AuthPolicy (límite 5 peticiones)
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-RateLimit", "true");

        HttpResponseMessage? lastResponse = null;
        for (int i = 0; i < 7; i++)
        {
            lastResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
                "invalid@user.com",
                "WrongPassword123!"
            ));
            if (lastResponse.StatusCode == HttpStatusCode.TooManyRequests)
            {
                break;
            }
        }

        Assert.NotNull(lastResponse);
        Assert.Equal(HttpStatusCode.TooManyRequests, lastResponse.StatusCode);
        Assert.Equal("application/problem+json", lastResponse.Content.Headers.ContentType?.MediaType);
    }
}
