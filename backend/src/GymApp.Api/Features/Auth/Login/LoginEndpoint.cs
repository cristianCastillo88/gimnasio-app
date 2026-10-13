using GymApp.Api.Common;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Auth.Login;

public static class LoginEndpoint
{
    public static void MapLoginEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/login", async Task<Results<Ok<AuthResponse>, ProblemHttpResult>> (
            LoginRequest request,
            ILoginHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .WithValidation<LoginRequest>()
        .RequireRateLimiting("AuthPolicy")
        .WithName("Login")
        .WithSummary("Iniciar sesión con email y contraseña")
        .WithTags("Auth")
        .Produces<AuthResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status429TooManyRequests)
        .ProducesValidationProblem();
    }
}
