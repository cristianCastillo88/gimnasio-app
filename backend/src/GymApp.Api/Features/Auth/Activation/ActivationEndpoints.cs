using GymApp.Api.Common;
using GymApp.Api.Features.Auth.Login;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Auth.Activation;

public static class ActivationEndpoints
{
    public static void MapActivationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .RequireRateLimiting("AuthPolicy")
            .WithTags("Auth");

        group.MapGet("/verify-activation-token", async Task<Results<Ok<VerifyActivationTokenResponse>, ProblemHttpResult>> (
            string token,
            IVerifyActivationTokenHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(token, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .WithName("VerifyActivationToken")
        .WithSummary("Verificar validez del token de activación")
        .Produces<VerifyActivationTokenResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/activate-account", async Task<Results<Ok<AuthResponse>, ProblemHttpResult>> (
            ActivateAccountRequest request,
            IActivateAccountHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .WithValidation<ActivateAccountRequest>()
        .WithName("ActivateAccount")
        .WithSummary("Activar cuenta y fijar contraseña personal con autologin")
        .Produces<AuthResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();
    }
}
