using System.Security.Claims;
using GymApp.Api.Common;
using GymApp.Api.Features.Students.GetActiveRoutine;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Trainer.Routines;

public static class TrainerRoutineEndpoints
{
    public static void MapTrainerRoutineEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/trainer/routines")
            .RequireAuthorization(policy => policy.RequireRole("TRAINER"))
            .WithTags("Trainer");

        // 0. Listar plantillas de rutina del entrenador (Transporte HTTP Puro -> IGetTrainerRoutinesHandler)
        group.MapGet("/", async Task<Results<Ok<List<RoutineTemplateSummaryDto>>, ProblemHttpResult>> (
            ClaimsPrincipal user,
            IGetTrainerRoutinesHandler handler,
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
        .WithName("GetTrainerRoutines")
        .WithSummary("Listar plantillas de rutina creadas por el entrenador")
        .Produces<List<RoutineTemplateSummaryDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 1. Crear plantilla de rutina (Transporte HTTP Puro -> ICreateRoutineTemplateHandler)
        group.MapPost("/", async Task<Results<Created<ActiveRoutineResponse>, ProblemHttpResult>> (
            CreateRoutineTemplateRequest request,
            ClaimsPrincipal user,
            ICreateRoutineTemplateHandler handler,
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

            return TypedResults.Created($"/api/trainer/routines/{result.Value!.Id}", result.Value);
        })
        .WithValidation<CreateRoutineTemplateRequest>()
        .WithName("CreateRoutineTemplate")
        .WithSummary("Crear una nueva plantilla de rutina completa con sesiones flexibles")
        .Produces<ActiveRoutineResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesValidationProblem();

        // 2. Obtener detalle de una plantilla de rutina por ID (Transporte HTTP Puro -> IGetRoutineTemplateByIdHandler)
        group.MapGet("/{id:guid}", async Task<Results<Ok<ActiveRoutineResponse>, ProblemHttpResult>> (
            Guid id,
            ClaimsPrincipal user,
            IGetRoutineTemplateByIdHandler handler,
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
        .WithName("GetTrainerRoutineById")
        .WithSummary("Obtener el detalle estructurado de una plantilla de rutina por su identificador")
        .Produces<ActiveRoutineResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);

        // 3. Actualizar plantilla de rutina completa (Transporte HTTP Puro -> IUpdateRoutineTemplateHandler)
        group.MapPut("/{id:guid}", async Task<Results<Ok<ActiveRoutineResponse>, ProblemHttpResult>> (
            Guid id,
            UpdateRoutineTemplateRequest request,
            ClaimsPrincipal user,
            IUpdateRoutineTemplateHandler handler,
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
        .WithValidation<UpdateRoutineTemplateRequest>()
        .WithName("UpdateTrainerRoutine")
        .WithSummary("Actualizar una plantilla de rutina completa con sus días y ejercicios")
        .Produces<ActiveRoutineResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();

        // 4. Duplicar plantilla de rutina (Transporte HTTP Puro -> IDuplicateRoutineTemplateHandler)
        group.MapPost("/{id:guid}/duplicate", async Task<Results<Created<ActiveRoutineResponse>, ProblemHttpResult>> (
            Guid id,
            ClaimsPrincipal user,
            IDuplicateRoutineTemplateHandler handler,
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

            return TypedResults.Created($"/api/trainer/routines/{result.Value!.Id}", result.Value);
        })
        .WithName("DuplicateTrainerRoutine")
        .WithSummary("Duplicar una plantilla de rutina existente")
        .Produces<ActiveRoutineResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);

        // 5. Asignar rutina a un alumno (Transporte HTTP Puro -> IAssignRoutineHandler)
        group.MapPost("/assign", async Task<Results<Ok<AssignRoutineResponse>, ProblemHttpResult>> (


            AssignRoutineRequest request,
            ClaimsPrincipal user,
            IAssignRoutineHandler handler,
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

            return TypedResults.Ok(result.Value!);
        })
        .WithValidation<AssignRoutineRequest>()
        .WithName("AssignRoutineToStudent")
        .WithSummary("Asignar una plantilla de rutina a un alumno")
        .Produces<AssignRoutineResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();

        // 5. Eliminar plantilla de rutina (solo si no tiene alumnos asignados activos)
        group.MapDelete("/{id:guid}", async Task<Results<NoContent, ProblemHttpResult>> (
            Guid id,
            ClaimsPrincipal user,
            IDeleteRoutineTemplateHandler handler,
            CancellationToken ct) =>
        {
            var trainerIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(trainerIdClaim, out var trainerId))
            {
                return ProblemDetailsResults.Unauthorized();
            }

            var result = await handler.HandleAsync(trainerId, id, ct);
            if (!result.IsSuccess)
            {
                return result.ToProblemHttpResult();
            }

            return TypedResults.NoContent();
        })
        .WithName("DeleteRoutineTemplate")
        .WithSummary("Eliminar plantilla de rutina (solo si no tiene alumnos asignados activos)")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
