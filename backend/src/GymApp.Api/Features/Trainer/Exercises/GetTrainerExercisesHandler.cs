using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Exercises;

public interface IGetTrainerExercisesHandler
{
    Task<Result<List<ExerciseDto>>> HandleAsync(Guid trainerId, CancellationToken ct);
}

public class GetTrainerExercisesHandler : IGetTrainerExercisesHandler
{
    private readonly GymAppDbContext _db;

    public GetTrainerExercisesHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<List<ExerciseDto>>> HandleAsync(Guid trainerId, CancellationToken ct)
    {
        var exercises = await _db.Exercises
            .AsNoTracking()
            .Where(e => e.TrainerId == trainerId)
            .OrderBy(e => e.MuscleGroup)
            .ThenBy(e => e.Name)
            .Select(TrainerExerciseMappers.ProjectToDto)
            .ToListAsync(ct);

        return Result<List<ExerciseDto>>.Success(exercises);
    }
}
