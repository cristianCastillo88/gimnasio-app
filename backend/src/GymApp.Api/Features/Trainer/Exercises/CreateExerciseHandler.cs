using GymApp.Api.Common;
using GymApp.Api.Database;
using GymApp.Api.Database.Entities;

namespace GymApp.Api.Features.Trainer.Exercises;

public interface ICreateExerciseHandler
{
    Task<Result<ExerciseDto>> HandleAsync(
        CreateExerciseRequest request,
        Guid trainerId,
        CancellationToken ct);
}

public class CreateExerciseHandler : ICreateExerciseHandler
{
    private readonly GymAppDbContext _db;

    public CreateExerciseHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<ExerciseDto>> HandleAsync(
        CreateExerciseRequest request,
        Guid trainerId,
        CancellationToken ct)
    {
        var exercise = Exercise.Create(
            trainerId,
            request.Name,
            request.MuscleGroup,
            request.MovementPattern,
            request.VideoUrl,
            request.ExecutionTips
        );

        _db.Exercises.Add(exercise);
        await _db.SaveChangesAsync(ct);

        return Result<ExerciseDto>.Success(exercise.ToDto());
    }
}
