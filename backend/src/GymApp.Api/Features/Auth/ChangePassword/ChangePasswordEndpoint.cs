using System.Security.Claims;
using GymApp.Api.Common;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Auth.ChangePassword;

public static class ChangePasswordEndpoint
{
    public static void MapChangePasswordEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/change-password", async Task<Results<Ok<object>, ProblemHttpResult>> (
            ChangePasswordRequest request,
            ClaimsPrincipal userPrincipal,
            IChangePasswordHandler handler,
            CancellationToken ct) =>
        {
            var userIdClaim = userPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return ProblemDetailsResults.Unauthorized();
            }

            var result = await handler.HandleAsync(userId, request, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok<object>(new { message = result.Value });
        })
        .WithValidation<ChangePasswordRequest>()
        .RequireAuthorization()
        .WithName("ChangePassword")
        .WithSummary("Cambiar contraseña de la cuenta en sesión activa")
        .WithTags("Auth")
        .Produces(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesValidationProblem();
    }
}
