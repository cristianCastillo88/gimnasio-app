using GymApp.Api.Common;
using GymApp.Api.Database;
using GymApp.Api.Database.Entities;
using GymApp.Api.Features.Students.GetActiveRoutine;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Routines;

public interface IDuplicateRoutineTemplateHandler
{
    Task<Result<ActiveRoutineResponse>> HandleAsync(
        Guid id,
        Guid trainerId,
        CancellationToken ct);
}

public class DuplicateRoutineTemplateHandler : IDuplicateRoutineTemplateHandler
{
    private readonly GymAppDbContext _db;

    public DuplicateRoutineTemplateHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<ActiveRoutineResponse>> HandleAsync(
        Guid id,
        Guid trainerId,
        CancellationToken ct)
    {
        // 1. Obtener la plantilla original sin tracking
        var original = await _db.RoutineTemplates
            .AsNoTracking()
            .Include(t => t.Days)
                .ThenInclude(d => d.RoutineExercises)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (original == null)
        {
            return Result<ActiveRoutineResponse>.NotFound(
                "La plantilla de rutina que deseas duplicar no existe.",
                "Rutina no encontrada"
            );
        }

        // 2. Validar que la plantilla pertenezca al entrenador solicitante
        if (original.TrainerId != trainerId)
        {
            return Result<ActiveRoutineResponse>.Forbidden(
                "No tienes autorización para duplicar una rutina que pertenece a otro entrenador."
            );
        }

        // 3. Crear nuevo agregado de RoutineTemplate con sufijo (Copia)
        var cloned = RoutineTemplate.Create(
            trainerId,
            $"{original.Title} (Copia)",
            original.Description
        );

        foreach (var originalDay in original.Days.OrderBy(d => d.OrderIndex))
        {
            var clonedDay = cloned.AddDay(originalDay.Name, originalDay.OrderIndex);

            foreach (var originalEx in originalDay.RoutineExercises.OrderBy(e => e.OrderIndex))
            {
                clonedDay.AddExercise(
                    originalEx.ExerciseId,
                    originalEx.OrderIndex,
                    originalEx.TargetSets,
                    originalEx.TargetReps,
                    originalEx.SuggestedWeightKg,
                    originalEx.SuggestedRestSeconds,
                    originalEx.Notes
                );
            }
        }

        // 4. Mapear datos de los ejercicios correspondientes
        var exerciseIds = cloned.Days
            .SelectMany(d => d.RoutineExercises.Select(e => e.ExerciseId))
            .Distinct()
            .ToList();

        var exerciseMap = await _db.Exercises
            .AsNoTracking()
            .Where(e => exerciseIds.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, e => e, ct);

        // 5. Persistir en base de datos
        _db.RoutineTemplates.Add(cloned);
        await _db.SaveChangesAsync(ct);

        // 6. Proyectar y retornar
        var response = cloned.ToResponse(exerciseMap);
        return Result<ActiveRoutineResponse>.Success(response);
    }
}
