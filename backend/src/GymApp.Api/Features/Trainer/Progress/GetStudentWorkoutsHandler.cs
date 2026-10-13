using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Progress;

public interface IGetStudentWorkoutsHandler
{
    Task<Result<StudentWorkoutHistoryResponse>> HandleAsync(
        Guid studentId,
        Guid trainerId,
        CancellationToken ct);
}

public class GetStudentWorkoutsHandler : IGetStudentWorkoutsHandler
{
    private readonly GymAppDbContext _db;

    public GetStudentWorkoutsHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<StudentWorkoutHistoryResponse>> HandleAsync(
        Guid studentId,
        Guid trainerId,
        CancellationToken ct)
    {
        var student = await _db.Students
            .Include(s => s.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == studentId && s.TrainerId == trainerId, ct);

        if (student is null)
        {
            return Result<StudentWorkoutHistoryResponse>.NotFound("No se encontró el alumno a cargo del entrenador.");
        }

        var sessions = await _db.WorkoutSessions
            .AsNoTracking()
            .Where(ws => ws.StudentId == studentId)
            .OrderByDescending(ws => ws.CompletedAt)
            .Select(TrainerProgressMappers.ProjectToSessionDto)
            .ToListAsync(ct);

        var response = new StudentWorkoutHistoryResponse(
            student.Id,
            student.User.FullName,
            sessions
        );

        return Result<StudentWorkoutHistoryResponse>.Success(response);
    }
}
