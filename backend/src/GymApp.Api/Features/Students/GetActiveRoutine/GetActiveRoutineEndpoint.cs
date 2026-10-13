using System.Security.Claims;
using GymApp.Api.Common;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Students.GetActiveRoutine;

public static class GetActiveRoutineEndpoint
{
    public static void MapGetActiveRoutineEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/students/me/routine", async Task<Results<Ok<ActiveRoutineResponse>, ProblemHttpResult>> (
            ClaimsPrincipal user,
            IGetActiveRoutineHandler handler,
            CancellationToken ct) =>
        {
            var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return ProblemDetailsResults.Unauthorized();
            }

            var result = await handler.HandleAsync(userId, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .RequireAuthorization(policy => policy.RequireRole("STUDENT"))
        .WithName("GetActiveStudentRoutine")
        .WithSummary("Obtener la rutina activa del alumno autenticado con sesiones y ejercicios")
        .WithTags("Students")
        .Produces<ActiveRoutineResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
