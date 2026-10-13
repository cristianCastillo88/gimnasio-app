namespace GymApp.Api.Features.Trainer.Progress;

/// <summary>
/// Registro de serie para supervisión del entrenador.
/// </summary>
/// <param name="ExerciseName">Nombre del ejercicio realizado.</param>
/// <param name="SetNumber">Número de serie ejecutada.</param>
/// <param name="ActualReps">Repeticiones reales alcanzadas.</param>
/// <param name="ActualWeightKg">Carga real empleada en kg.</param>
/// <param name="IsCompleted">Indica si la serie fue finalizada con éxito.</param>
public record TrainerWorkoutLogDto(
    string ExerciseName,
    int SetNumber,
    int ActualReps,
    decimal ActualWeightKg,
    bool IsCompleted
);

/// <summary>
/// Sesión de entrenamiento completada por el alumno para auditoría del entrenador.
/// </summary>
/// <param name="Id">Identificador único de la sesión.</param>
/// <param name="RoutineDayName">Nombre del día de rutina ejecutado si corresponde.</param>
/// <param name="StartedAt">Fecha y hora UTC de inicio.</param>
/// <param name="CompletedAt">Fecha y hora UTC de finalización.</param>
/// <param name="RpeScore">Esfuerzo percibido reportado (1 a 10).</param>
/// <param name="StudentNotes">Sensaciones o comentarios dejados por el alumno.</param>
/// <param name="Sets">Listado de series registradas.</param>
public record TrainerWorkoutSessionDto(
    Guid Id,
    string? RoutineDayName,
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt,
    int RpeScore,
    string? StudentNotes,
    List<TrainerWorkoutLogDto> Sets
);

/// <summary>
/// Historial completo de entrenamientos de un alumno supervisado.
/// </summary>
/// <param name="StudentId">Identificador del alumno.</param>
/// <param name="StudentName">Nombre completo del alumno.</param>
/// <param name="Sessions">Colección cronológica de sesiones de entrenamiento ejecutadas.</param>
public record StudentWorkoutHistoryResponse(
    Guid StudentId,
    string StudentName,
    List<TrainerWorkoutSessionDto> Sessions
);
