using System.Linq.Expressions;
using GymApp.Api.Database.Entities;

namespace GymApp.Api.Features.Trainer.Exercises;

public static class TrainerExerciseMappers
{
    /// <summary>
    /// Expresión reusable para proyectar consultas de ejercicios directamente en PostgreSQL.
    /// </summary>
    public static readonly Expression<Func<Exercise, ExerciseDto>> ProjectToDto = e =>
        new ExerciseDto(
            e.Id,
            e.Name,
            e.MuscleGroup,
            e.MovementPattern,
            e.VideoUrl,
            e.ExecutionTips
        );

    /// <summary>
    /// Método de extensión para mapear una entidad Exercise en memoria a su DTO.
    /// </summary>
    public static ExerciseDto ToDto(this Exercise exercise)
    {
        return new ExerciseDto(
            exercise.Id,
            exercise.Name,
            exercise.MuscleGroup,
            exercise.MovementPattern,
            exercise.VideoUrl,
            exercise.ExecutionTips
        );
    }
}
