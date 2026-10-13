using System.Security.Claims;
using GymApp.Api.Common;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Trainer.Exercises;

public static class TrainerExerciseEndpoints
{
    public static void MapTrainerExerciseEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/trainer/exercises")
            .RequireAuthorization(policy => policy.RequireRole("TRAINER"))
            .WithTags("Trainer");

        // 1. Listar ejercicios del Trainer (Transporte Puro -> IGetTrainerExercisesHandler)
        group.MapGet("/", async Task<Results<Ok<List<ExerciseDto>>, ProblemHttpResult>> (
            ClaimsPrincipal user,
            IGetTrainerExercisesHandler handler,
            CancellationToken ct) =>
        {
            var trainerIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(trainerIdClaim, out var trainerId))
            {
                return ProblemDetailsResults.Unauthorized();
            }

            var result = await handler.HandleAsync(trainerId, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .WithName("GetTrainerExercises")
        .WithSummary("Listar todos los ejercicios de la biblioteca del Trainer")
        .Produces<List<ExerciseDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 2. Crear ejercicio (Transporte Puro -> ICreateExerciseHandler)
        group.MapPost("/", async Task<Results<Created<ExerciseDto>, ProblemHttpResult>> (
            CreateExerciseRequest request,
            ClaimsPrincipal user,
            ICreateExerciseHandler handler,
            CancellationToken ct) =>
        {
            var trainerIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(trainerIdClaim, out var trainerId))
            {
                return ProblemDetailsResults.Unauthorized();
            }

            var result = await handler.HandleAsync(request, trainerId, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Created($"/api/trainer/exercises/{result.Value!.Id}", result.Value);
        })
        .WithValidation<CreateExerciseRequest>()
        .WithName("CreateTrainerExercise")
        .WithSummary("Crear un nuevo ejercicio en la biblioteca del Trainer")
        .Produces<ExerciseDto>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesValidationProblem();

        // 3. Actualizar ejercicio existente (Transporte Puro -> IUpdateExerciseHandler)
        group.MapPut("/{id:guid}", async Task<Results<Ok<ExerciseDto>, ProblemHttpResult>> (
            Guid id,
            UpdateExerciseRequest request,
            ClaimsPrincipal user,
            IUpdateExerciseHandler handler,
            CancellationToken ct) =>
        {
            var trainerIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(trainerIdClaim, out var trainerId))
            {
                return ProblemDetailsResults.Unauthorized();
            }

            var result = await handler.HandleAsync(id, request, trainerId, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.Ok(result.Value!);
        })
        .WithValidation<UpdateExerciseRequest>()
        .WithName("UpdateTrainerExercise")
        .WithSummary("Actualizar un ejercicio existente en la biblioteca del Trainer")
        .Produces<ExerciseDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();
    }
}

