using GymApp.Api.Common;
using GymApp.Api.Database;
using GymApp.Api.Features.Students.GetActiveRoutine;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Routines;

public interface IGetRoutineTemplateByIdHandler
{
    Task<Result<ActiveRoutineResponse>> HandleAsync(
        Guid id,
        Guid trainerId,
        CancellationToken ct);
}

public class GetRoutineTemplateByIdHandler : IGetRoutineTemplateByIdHandler
{
    private readonly GymAppDbContext _db;

    public GetRoutineTemplateByIdHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<ActiveRoutineResponse>> HandleAsync(
        Guid id,
        Guid trainerId,
        CancellationToken ct)
    {
        var template = await _db.RoutineTemplates
            .AsNoTracking()
            .Include(t => t.Days)
                .ThenInclude(d => d.RoutineExercises)
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (template == null)
        {
            return Result<ActiveRoutineResponse>.NotFound(
                "La plantilla de rutina especificada no existe.",
                "Rutina no encontrada"
            );
        }

        if (template.TrainerId != trainerId)
        {
            return Result<ActiveRoutineResponse>.Forbidden(
                "No tienes autorización para acceder a una rutina que pertenece a otro entrenador."
            );
        }

        var exerciseIds = template.Days
            .SelectMany(d => d.RoutineExercises.Select(e => e.ExerciseId))
            .Distinct()
            .ToList();

        var exerciseMap = await _db.Exercises
            .AsNoTracking()
            .Where(e => exerciseIds.Contains(e.Id))
            .ToDictionaryAsync(e => e.Id, e => e, ct);

        var response = template.ToResponse(exerciseMap);
        return Result<ActiveRoutineResponse>.Success(response);
    }
}
