namespace GymApp.Api.Features.Exercises.GetExerciseHistory;

/// <summary>
/// Registro histórico de una serie previa completada.
/// </summary>
/// <param name="SetNumber">Número de serie.</param>
/// <param name="Reps">Repeticiones reales alcanzadas.</param>
/// <param name="WeightKg">Carga real empleada en kg.</param>
public record SetHistoryDto(int SetNumber, int Reps, decimal WeightKg);

/// <summary>
/// Resumen de series de un ejercicio en una sesión histórica previa.
/// </summary>
/// <param name="Date">Fecha y hora UTC de la sesión.</param>
/// <param name="Sets">Listado de series registradas.</param>
public record SessionHistoryItemDto(DateTimeOffset Date, List<SetHistoryDto> Sets);

/// <summary>
/// Historial cronológico de un ejercicio para el alumno autenticado.
/// </summary>
/// <param name="ExerciseId">Identificador único del ejercicio.</param>
/// <param name="Logs">Últimas sesiones completadas con sus respectivas series.</param>
public record ExerciseHistoryResponse(Guid ExerciseId, List<SessionHistoryItemDto> Logs);
