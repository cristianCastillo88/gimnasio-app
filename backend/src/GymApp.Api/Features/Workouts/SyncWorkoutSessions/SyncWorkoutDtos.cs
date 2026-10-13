namespace GymApp.Api.Features.Workouts.SyncWorkoutSessions;

/// <summary>
/// Registro individual de una serie ejecutada en el gimnasio.
/// </summary>
/// <param name="ExerciseId">Identificador único del ejercicio.</param>
/// <param name="SetNumber">Número de serie completada.</param>
/// <param name="ActualReps">Repeticiones reales realizadas.</param>
/// <param name="ActualWeightKg">Peso real utilizado en kilogramos.</param>
/// <param name="IsCompleted">Indica si la serie fue completada con éxito.</param>
public record WorkoutSetLogPayload(
    Guid ExerciseId,
    int SetNumber,
    int ActualReps,
    decimal ActualWeightKg,
    bool IsCompleted
);

/// <summary>
/// Sesión de entrenamiento finalizada en modo offline.
/// </summary>
/// <param name="IdempotencyKey">Clave de idempotencia única (UUIDv4) generada por el cliente.</param>
/// <param name="RoutineDayId">Identificador del día de rutina ejecutado, si aplica.</param>
/// <param name="StartedAt">Fecha y hora UTC de inicio de la sesión.</param>
/// <param name="CompletedAt">Fecha y hora UTC de finalización.</param>
/// <param name="RpeScore">Índice de esfuerzo percibido (RPE de 1 a 10).</param>
/// <param name="StudentNotes">Comentarios o sensaciones registradas por el alumno.</param>
/// <param name="Sets">Colección de series ejecutadas durante la sesión.</param>
public record WorkoutSessionPayload(
    Guid IdempotencyKey,
    Guid? RoutineDayId,
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt,
    int RpeScore,
    string? StudentNotes,
    List<WorkoutSetLogPayload> Sets
);

/// <summary>
/// Petición de sincronización por lotes de sesiones pendientes en IndexedDB.
/// </summary>
/// <param name="Sessions">Colección de sesiones de entrenamiento a sincronizar.</param>
public record SyncWorkoutBatchRequest(List<WorkoutSessionPayload> Sessions);

/// <summary>
/// Resultado de sincronización para una sesión específica.
/// </summary>
/// <param name="IdempotencyKey">Clave de idempotencia correspondiente a la sesión.</param>
/// <param name="Status">Estado de resolución: CREATED, ALREADY_EXISTS o ERROR.</param>
/// <param name="Message">Mensaje explicativo del estado de persistencia.</param>
public record SyncResultItem(
    Guid IdempotencyKey,
    string Status,
    string? Message = null
);

/// <summary>
/// Respuesta del lote de sincronización de entrenamientos.
/// </summary>
/// <param name="SyncedCount">Cantidad de nuevas sesiones persistidas en base de datos.</param>
/// <param name="Results">Detalle de resolución individual por cada clave de idempotencia enviada.</param>
public record SyncWorkoutBatchResponse(
    int SyncedCount,
    List<SyncResultItem> Results
);
