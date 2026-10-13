using System.Security.Claims;
using GymApp.Api.Common;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Workouts.SyncWorkoutSessions;

public static class SyncWorkoutEndpoint
{
    public static void MapSyncWorkoutEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/workouts/sync", async Task<Results<Ok<SyncWorkoutBatchResponse>, ProblemHttpResult>> (
            SyncWorkoutBatchRequest request,
            ClaimsPrincipal user,
            ISyncWorkoutSessionsHandler handler,
            CancellationToken ct) =>
        {
            var userIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return ProblemDetailsResults.Unauthorized();
            }

            var result = await handler.HandleAsync(request, userId, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .WithValidation<SyncWorkoutBatchRequest>()
        .RequireAuthorization(policy => policy.RequireRole("STUDENT"))
        .WithName("SyncWorkoutSessions")
        .WithSummary("Sincronizar lote de sesiones de entrenamiento offline con clave de idempotencia")
        .WithTags("Workouts")
        .Produces<SyncWorkoutBatchResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();
    }
}
