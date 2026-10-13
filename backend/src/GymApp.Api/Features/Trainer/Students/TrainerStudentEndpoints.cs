using System.Security.Claims;
using GymApp.Api.Common;
using Microsoft.AspNetCore.Http.HttpResults;

namespace GymApp.Api.Features.Trainer.Students;

public static class TrainerStudentEndpoints
{
    public static void MapTrainerStudentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/trainer/students")
            .RequireAuthorization(policy => policy.RequireRole("TRAINER"))
            .WithTags("Trainer");

        // 1. Listar alumnos del Trainer (Transporte Puro -> IGetTrainerStudentsHandler)
        group.MapGet("/", async Task<Results<Ok<List<StudentSummaryDto>>, ProblemHttpResult>> (
            ClaimsPrincipal user,
            IGetTrainerStudentsHandler handler,
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
        .WithName("GetTrainerStudents")
        .WithSummary("Listar todos los alumnos a cargo del Trainer autenticado")
        .Produces<List<StudentSummaryDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 2. Dar de alta nuevo alumno (Transporte Puro -> ICreateStudentHandler)
        group.MapPost("/", async Task<Results<Created<StudentSummaryDto>, ProblemHttpResult>> (
            CreateStudentRequest request,
            ClaimsPrincipal user,
            ICreateStudentHandler handler,
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

            return TypedResults.Created($"/api/trainer/students/{result.Value!.Id}", result.Value);
        })
        .WithValidation<CreateStudentRequest>()
        .WithName("CreateStudent")
        .WithSummary("Registrar un nuevo alumno a cargo del Trainer")
        .Produces<StudentSummaryDto>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesValidationProblem();

        // 3. Actualizar estado de cuota y clases restantes (Transporte Puro -> IUpdateStudentSubscriptionHandler)
        group.MapPatch("/{id:guid}/subscription", async Task<Results<Ok<StudentSummaryDto>, ProblemHttpResult>> (
            Guid id,
            UpdateSubscriptionRequest request,
            ClaimsPrincipal user,
            IUpdateStudentSubscriptionHandler handler,
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
        .WithValidation<UpdateSubscriptionRequest>()
        .WithName("UpdateStudentSubscription")
        .WithSummary("Actualizar cuota, clases y fecha de cobro de un alumno")
        .Produces<StudentSummaryDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();

        // 4. Regenerar token de activación (Transporte Puro -> IRegenerateActivationTokenHandler)
        group.MapPost("/{id:guid}/activation-token", async Task<Results<Ok<RegenerateActivationTokenResponse>, ProblemHttpResult>> (
            Guid id,
            ClaimsPrincipal user,
            IRegenerateActivationTokenHandler handler,
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
        .WithName("RegenerateActivationToken")
        .WithSummary("Regenerar enlace de activación para un alumno")
        .Produces<RegenerateActivationTokenResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);

        // 5. Restablecer contraseña de alumno vía WhatsApp (Transporte Puro -> IRegenerateActivationTokenHandler)
        group.MapPost("/{id:guid}/reset-password-token", async Task<Results<Ok<RegenerateActivationTokenResponse>, ProblemHttpResult>> (
            Guid id,
            ClaimsPrincipal user,
            IRegenerateActivationTokenHandler handler,
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
        .WithName("ResetStudentPasswordToken")
        .WithSummary("Generar nuevo token de restablecimiento para un alumno y reenviar por WhatsApp")
        .Produces<RegenerateActivationTokenResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
