using System.Linq.Expressions;
using GymApp.Api.Database.Entities;

namespace GymApp.Api.Features.Trainer.Progress;

public static class TrainerProgressMappers
{
    /// <summary>
    /// Expresión reusable para proyectar sesiones completadas y sus series directamente en la base de datos.
    /// </summary>
    public static readonly Expression<Func<WorkoutSession, TrainerWorkoutSessionDto>> ProjectToSessionDto = ws =>
        new TrainerWorkoutSessionDto(
            ws.Id,
            ws.RoutineDay != null ? ws.RoutineDay.Name : null,
            ws.StartedAt,
            ws.CompletedAt,
            ws.RpeScore,
            ws.StudentNotes,
            ws.Logs.OrderBy(l => l.Exercise.Name).ThenBy(l => l.SetNumber).Select(l => new TrainerWorkoutLogDto(
                l.Exercise.Name,
                l.SetNumber,
                l.ActualReps,
                l.ActualWeightKg,
                l.IsCompleted
            )).ToList()
        );
}
