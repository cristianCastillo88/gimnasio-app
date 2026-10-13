using GymApp.Api.Common;
using GymApp.Api.Database;
using GymApp.Api.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Routines;

public interface IAssignRoutineHandler
{
    Task<Result<AssignRoutineResponse>> HandleAsync(
        AssignRoutineRequest request,
        Guid trainerId,
        CancellationToken ct);
}

public class AssignRoutineHandler : IAssignRoutineHandler
{
    private readonly GymAppDbContext _db;

    public AssignRoutineHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<AssignRoutineResponse>> HandleAsync(
        AssignRoutineRequest request,
        Guid trainerId,
        CancellationToken ct)
    {
        // 1. Validar existencia del alumno a cargo del entrenador
        var studentExists = await _db.Students
            .AnyAsync(s => s.Id == request.StudentId && s.TrainerId == trainerId, ct);

        if (!studentExists)
        {
            return Result<AssignRoutineResponse>.NotFound("No se encontró el alumno a cargo del entrenador.");
        }

        // 2. Validar existencia de la plantilla de rutina del entrenador
        var templateExists = await _db.RoutineTemplates
            .AnyAsync(t => t.Id == request.RoutineTemplateId && t.TrainerId == trainerId, ct);

        if (!templateExists)
        {
            return Result<AssignRoutineResponse>.NotFound("No se encontró la plantilla de rutina especificada.");
        }

        // 3. Optimización EF Core 10: Desactivar rutinas activas previas directamente en BD (ExecuteUpdateAsync)
        // con fallback en memoria para soporte de testing (InMemory provider)
        if (_db.Database.ProviderName?.Contains("InMemory", StringComparison.OrdinalIgnoreCase) == true)
        {
            var currentActive = await _db.RoutineAssignments
                .Where(ra => ra.StudentId == request.StudentId && ra.IsActive)
                .ToListAsync(ct);

            foreach (var ra in currentActive)
            {
                ra.Deactivate();
            }
        }
        else
        {
            await _db.RoutineAssignments
                .Where(ra => ra.StudentId == request.StudentId && ra.IsActive)
                .ExecuteUpdateAsync(setter => setter.SetProperty(ra => ra.IsActive, false), ct);
        }

        // 4. Crear la nueva asignación activa encapsulada en el modelo de dominio
        var newAssignment = RoutineAssignment.CreateActive(request.StudentId, request.RoutineTemplateId);
        _db.RoutineAssignments.Add(newAssignment);
        await _db.SaveChangesAsync(ct);

        // 5. Retornar DTO de resultado exitoso
        var response = new AssignRoutineResponse(
            "Rutina asignada exitosamente al alumno.",
            request.StudentId,
            request.RoutineTemplateId
        );

        return Result<AssignRoutineResponse>.Success(response);
    }
}
