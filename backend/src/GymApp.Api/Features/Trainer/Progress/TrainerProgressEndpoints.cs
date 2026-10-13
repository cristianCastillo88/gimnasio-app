using System.Security.Claims;
using GymApp.Api.Common;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Trainer.Progress;

public static class TrainerProgressEndpoints
{
    public static void MapTrainerProgressEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/trainer/students")
            .RequireAuthorization(policy => policy.RequireRole("TRAINER"))
            .WithTags("Trainer");

        // Supervisión de historial de alumno (Transporte Puro -> IGetStudentWorkoutsHandler)
        group.MapGet("/{id:guid}/workouts", async Task<Results<Ok<StudentWorkoutHistoryResponse>, ProblemHttpResult>> (
            Guid id,
            ClaimsPrincipal user,
            IGetStudentWorkoutsHandler handler,
            CancellationToken ct) =>
        {
            var trainerIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(trainerIdClaim, out var trainerId))
            {
                return ProblemDetailsResults.Unauthorized();
            }

            var result = await handler.HandleAsync(id, trainerId, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .WithName("GetStudentWorkoutHistory")
        .WithSummary("Obtener el historial completo de entrenamientos de un alumno para supervisión del Trainer")
        .Produces<StudentWorkoutHistoryResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
