using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Exercises.GetExerciseHistory;

public interface IGetExerciseHistoryHandler
{
    Task<Result<ExerciseHistoryResponse>> HandleAsync(Guid exerciseId, Guid userId, CancellationToken ct);
}

public class GetExerciseHistoryHandler : IGetExerciseHistoryHandler
{
    private readonly GymAppDbContext _db;

    public GetExerciseHistoryHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<ExerciseHistoryResponse>> HandleAsync(Guid exerciseId, Guid userId, CancellationToken ct)
    {
        var student = await _db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (student is null)
        {
            return Result<ExerciseHistoryResponse>.NotFound("Perfil de alumno no encontrado.");
        }

        // Consultar historial del ejercicio ordenado cronológicamente
        var logs = await _db.WorkoutLogs
            .AsNoTracking()
            .Where(wl => wl.ExerciseId == exerciseId && wl.Session.StudentId == student.Id)
            .OrderByDescending(wl => wl.Session.CompletedAt)
            .ThenBy(wl => wl.SetNumber)
            .Select(wl => new ExerciseLogItem(
                wl.Session.CompletedAt,
                wl.SetNumber,
                wl.ActualReps,
                wl.ActualWeightKg
            ))
            .ToListAsync(ct);

        var response = logs.ToHistoryResponse(exerciseId);
        return Result<ExerciseHistoryResponse>.Success(response);
    }
}
