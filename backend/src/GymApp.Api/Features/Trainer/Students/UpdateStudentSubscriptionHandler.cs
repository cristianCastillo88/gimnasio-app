using GymApp.Api.Common;
using GymApp.Api.Database;
using GymApp.Api.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Students;

public interface IUpdateStudentSubscriptionHandler
{
    Task<Result<StudentSummaryDto>> HandleAsync(
        Guid studentId,
        UpdateSubscriptionRequest request,
        Guid trainerId,
        CancellationToken ct);
}

public class UpdateStudentSubscriptionHandler : IUpdateStudentSubscriptionHandler
{
    private readonly GymAppDbContext _db;

    public UpdateStudentSubscriptionHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<StudentSummaryDto>> HandleAsync(
        Guid studentId,
        UpdateSubscriptionRequest request,
        Guid trainerId,
        CancellationToken ct)
    {
        var student = await _db.Students
            .Include(s => s.User)
            .Include(s => s.RoutineAssignments.Where(ra => ra.IsActive))
                .ThenInclude(ra => ra.RoutineTemplate)
            .FirstOrDefaultAsync(s => s.Id == studentId && s.TrainerId == trainerId, ct);

        if (student is null)
        {
            return Result<StudentSummaryDto>.NotFound("Alumno no encontrado bajo el control del entrenador.");
        }

        if (!Enum.TryParse<SubscriptionStatus>(request.SubscriptionStatus, true, out var newStatus))
        {
            return Result<StudentSummaryDto>.BadRequest(
                $"Estado de suscripción no válido: '{request.SubscriptionStatus}'. Valores permitidos: ACTIVE, EXPIRED, PENDING.",
                "Estado inválido"
            );
        }

        // Mutación controlada mediante método de dominio
        student.UpdateSubscription(newStatus, request.SessionsRemainingDelta, request.NextBillingDate);
        await _db.SaveChangesAsync(ct);

        var activeRoutineTitle = student.RoutineAssignments
            .FirstOrDefault(ra => ra.IsActive)?
            .RoutineTemplate.Title;

        return Result<StudentSummaryDto>.Success(student.ToSummaryDto(activeRoutineTitle));
    }
}
