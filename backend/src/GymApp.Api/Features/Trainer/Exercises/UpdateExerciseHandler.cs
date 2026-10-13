using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Exercises;

public interface IUpdateExerciseHandler
{
    Task<Result<ExerciseDto>> HandleAsync(
        Guid id,
        UpdateExerciseRequest request,
        Guid trainerId,
        CancellationToken ct);
}

public class UpdateExerciseHandler : IUpdateExerciseHandler
{
    private readonly GymAppDbContext _db;

    public UpdateExerciseHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<ExerciseDto>> HandleAsync(
        Guid id,
        UpdateExerciseRequest request,
        Guid trainerId,
        CancellationToken ct)
    {
        var exercise = await _db.Exercises.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (exercise == null)
        {
            return Result<ExerciseDto>.NotFound("El ejercicio especificado no existe.", "Ejercicio no encontrado");
        }

        if (exercise.TrainerId != trainerId)
        {
            return Result<ExerciseDto>.Forbidden("No tienes autorización para editar un ejercicio que pertenece a otro entrenador.");
        }

        exercise.Update(
            request.Name,
            request.MuscleGroup,
            request.MovementPattern,
            request.VideoUrl,
            request.ExecutionTips
        );

        await _db.SaveChangesAsync(ct);

        return Result<ExerciseDto>.Success(exercise.ToDto());
    }
}
