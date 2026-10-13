using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Students.GetActiveRoutine;

public interface IGetActiveRoutineHandler
{
    Task<Result<ActiveRoutineResponse>> HandleAsync(Guid userId, CancellationToken ct);
}

public class GetActiveRoutineHandler : IGetActiveRoutineHandler
{
    private readonly GymAppDbContext _db;

    public GetActiveRoutineHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<ActiveRoutineResponse>> HandleAsync(Guid userId, CancellationToken ct)
    {
        // 1. Obtener el perfil del alumno autenticado
        var student = await _db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (student is null)
        {
            return Result<ActiveRoutineResponse>.NotFound("No se encontró el perfil de alumno asociado al usuario.");
        }

        // 2. Obtener la rutina activa asignada con optimizaciones de carga
        var activeAssignment = await _db.RoutineAssignments
            .AsNoTracking()
            .Where(ra => ra.StudentId == student.Id && ra.IsActive)
            .Include(ra => ra.RoutineTemplate)
                .ThenInclude(t => t.Days.OrderBy(d => d.OrderIndex))
                    .ThenInclude(d => d.RoutineExercises.OrderBy(re => re.OrderIndex))
                        .ThenInclude(re => re.Exercise)
            .FirstOrDefaultAsync(ct);

        if (activeAssignment is null)
        {
            return Result<ActiveRoutineResponse>.NotFound("El alumno no posee ninguna rutina activa asignada.");
        }

        var template = activeAssignment.RoutineTemplate;

        // 3. Extraer IDs de ejercicios para precargar historial previo si existiera
        var exerciseIds = template.Days
            .SelectMany(d => d.RoutineExercises.Select(re => re.ExerciseId))
            .Distinct()
            .ToList();

        // 4. Buscar la última sesión completada para cada ejercicio del alumno
        var recentLogs = await _db.WorkoutLogs
            .AsNoTracking()
            .Where(wl => wl.Session.StudentId == student.Id && exerciseIds.Contains(wl.ExerciseId))
            .OrderByDescending(wl => wl.Session.CompletedAt)
            .Select(wl => new
            {
                wl.ExerciseId,
                wl.Session.CompletedAt,
                wl.SetNumber,
                wl.ActualWeightKg,
                wl.ActualReps
            })
            .ToListAsync(ct);

        var previousHistoryMap = recentLogs
            .GroupBy(l => l.ExerciseId)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var latestDate = g.First().CompletedAt;
                    var sets = g
                        .Where(x => x.CompletedAt == latestDate)
                        .OrderBy(x => x.SetNumber)
                        .Select(x => new SetPerformanceDto(x.SetNumber, x.ActualReps, x.ActualWeightKg))
                        .ToList();

                    return new PreviousPerformanceDto(latestDate, sets);
                }
            );

        // 5. Proyectar a DTO fuertemente tipado mediante mapper del slice
        var response = template.ToResponse(previousHistoryMap);
        return Result<ActiveRoutineResponse>.Success(response);
    }
}
