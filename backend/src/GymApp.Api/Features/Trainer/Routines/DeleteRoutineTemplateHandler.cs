using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Routines;

public interface IDeleteRoutineTemplateHandler
{
    Task<Result<bool>> HandleAsync(Guid trainerId, Guid templateId, CancellationToken ct);
}

public class DeleteRoutineTemplateHandler : IDeleteRoutineTemplateHandler
{
    private readonly GymAppDbContext _db;

    public DeleteRoutineTemplateHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<bool>> HandleAsync(Guid trainerId, Guid templateId, CancellationToken ct)
    {
        // 1. Obtener la plantilla con sus asignaciones y días
        var template = await _db.RoutineTemplates
            .Include(t => t.Assignments)
            .Include(t => t.Days)
                .ThenInclude(d => d.RoutineExercises)
            .FirstOrDefaultAsync(t => t.Id == templateId, ct);

        if (template is null)
        {
            return Result<bool>.NotFound(
                "La plantilla de rutina no existe.",
                "Rutina no encontrada");
        }

        if (template.TrainerId != trainerId)
        {
            return Result<bool>.Forbidden(
                "No tienes permisos para eliminar esta rutina.",
                "Acceso denegado");
        }

        // 2. Verificar que no tenga alumnos asignados activos
        var hasActiveAssignments = template.Assignments.Any(a => a.IsActive);
        if (hasActiveAssignments)
        {
            return Result<bool>.Conflict(
                "No se puede eliminar la rutina porque está asignada a uno o más alumnos activos. Desasígnala antes de eliminarla.",
                "Rutina asignada a alumnos");
        }

        // 3. Desvincular de forma segura las sesiones pasadas para preservar el historial del alumno (SetNull)
        var dayIds = template.Days.Select(d => d.Id).ToList();
        if (dayIds.Count > 0)
        {
            var pastSessions = await _db.WorkoutSessions
                .Where(ws => ws.RoutineDayId.HasValue && dayIds.Contains(ws.RoutineDayId.Value))
                .ToListAsync(ct);

            foreach (var session in pastSessions)
            {
                session.RoutineDayId = null;
            }
        }

        // 4. Remover asignaciones históricas inactivas de esta plantilla
        if (template.Assignments.Count > 0)
        {
            _db.RoutineAssignments.RemoveRange(template.Assignments);
        }

        // 5. Remover la plantilla (cascada para días y ejercicios)
        _db.RoutineTemplates.Remove(template);
        await _db.SaveChangesAsync(ct);

        return Result<bool>.Success(true);
    }
}
