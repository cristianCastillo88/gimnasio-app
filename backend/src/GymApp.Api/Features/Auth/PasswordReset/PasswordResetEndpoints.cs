using GymApp.Api.Common;
using GymApp.Api.Features.Auth.Login;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Auth.PasswordReset;

public static class PasswordResetEndpoints
{
    public static void MapPasswordResetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Auth");

        group.MapPost("/forgot-password", async Task<Results<Ok<ForgotPasswordResponse>, ProblemHttpResult>> (
            ForgotPasswordRequest request,
            IForgotPasswordHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .WithValidation<ForgotPasswordRequest>()
        .RequireRateLimiting("AuthPolicy")
        .WithName("ForgotPassword")
        .WithSummary("Solicitar enlace de recuperación de contraseña por correo electrónico")
        .Produces<ForgotPasswordResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesValidationProblem();

        group.MapGet("/verify-reset-token", async Task<Results<Ok<VerifyResetTokenResponse>, ProblemHttpResult>> (
            string token,
            IVerifyResetTokenHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(token, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .WithName("VerifyResetToken")
        .WithSummary("Verificar validez del token de restablecimiento por correo")
        .Produces<VerifyResetTokenResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/reset-password", async Task<Results<Ok<AuthResponse>, ProblemHttpResult>> (
            ResetPasswordRequest request,
            IResetPasswordHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(request, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .WithValidation<ResetPasswordRequest>()
        .RequireRateLimiting("AuthPolicy")
        .WithName("ResetPassword")
        .WithSummary("Restablecer contraseña mediante token de correo y autologuear")
        .Produces<AuthResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();
    }
}
