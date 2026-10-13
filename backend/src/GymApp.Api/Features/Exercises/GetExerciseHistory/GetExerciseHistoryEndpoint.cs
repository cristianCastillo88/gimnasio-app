using System.Security.Claims;
using GymApp.Api.Common;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Exercises.GetExerciseHistory;

public static class GetExerciseHistoryEndpoint
{
    public static void MapGetExerciseHistoryEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/exercises/{id:guid}/history", async Task<Results<Ok<ExerciseHistoryResponse>, ProblemHttpResult>> (
            Guid id,
            ClaimsPrincipal user,
            IGetExerciseHistoryHandler handler,
            CancellationToken ct) =>
        {
            var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return ProblemDetailsResults.Unauthorized();
            }

            var result = await handler.HandleAsync(id, userId, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .RequireAuthorization(policy => policy.RequireRole("STUDENT"))
        .WithName("GetExerciseHistory")
        .WithSummary("Obtener el historial previo de series de un ejercicio para el alumno")
        .WithTags("Exercises")
        .Produces<ExerciseHistoryResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
