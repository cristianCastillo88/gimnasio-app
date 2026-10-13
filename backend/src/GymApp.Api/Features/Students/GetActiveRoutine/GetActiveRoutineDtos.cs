namespace GymApp.Api.Features.Students.GetActiveRoutine;

/// <summary>
/// Rendimiento real registrado para una serie específica.
/// </summary>
/// <param name="SetNumber">Número correlativo de la serie (1, 2, 3...).</param>
/// <param name="Reps">Repeticiones reales ejecutadas.</param>
/// <param name="WeightKg">Carga real empleada en kilogramos.</param>
public record SetPerformanceDto(int SetNumber, int Reps, decimal WeightKg);

/// <summary>
/// Historial previo de la última sesión completada para un ejercicio.
/// Permite al alumno comparar sus cargas previas directamente en pantalla.
/// </summary>
/// <param name="Date">Fecha y hora UTC de la sesión previa.</param>
/// <param name="Sets">Listado de series registradas en dicha sesión.</param>
public record PreviousPerformanceDto(DateTimeOffset Date, List<SetPerformanceDto> Sets);

/// <summary>
/// Detalle de un ejercicio asignado dentro del día de rutina.
/// </summary>
/// <param name="Id">Identificador único del registro de asignación.</param>
/// <param name="ExerciseId">Identificador del ejercicio en la biblioteca.</param>
/// <param name="Name">Nombre del ejercicio (ej. "Sentadilla búlgara").</param>
/// <param name="MuscleGroup">Grupo muscular principal.</param>
/// <param name="TargetSets">Cantidad de series objetivo.</param>
/// <param name="TargetReps">Rango de repeticiones objetivo (ej. "8-10").</param>
/// <param name="SuggestedWeightKg">Carga sugerida en kg por el entrenador.</param>
/// <param name="SuggestedRestSeconds">Tiempo de descanso recomendado en segundos.</param>
/// <param name="VideoUrl">Enlace al video demostrativo de ejecución.</param>
/// <param name="ExecutionTips">Consejos técnicos y postura clave.</param>
/// <param name="PreviousSession">Rendimiento previo más reciente si existe.</param>
public record RoutineExerciseDetailDto(
    Guid Id,
    Guid ExerciseId,
    string Name,
    string MuscleGroup,
    int TargetSets,
    string TargetReps,
    decimal? SuggestedWeightKg,
    int SuggestedRestSeconds,
    string? VideoUrl,
    string? ExecutionTips,
    PreviousPerformanceDto? PreviousSession = null
);

/// <summary>
/// Sesión o día de entrenamiento dentro de la rutina (ej. "Día A: Piernas").
/// </summary>
/// <param name="Id">Identificador del día.</param>
/// <param name="Name">Nombre descriptivo del día.</param>
/// <param name="OrderIndex">Orden de ejecución semanal.</param>
/// <param name="Exercises">Listado ordenado de ejercicios del día.</param>
public record RoutineDayDetailDto(
    Guid Id,
    string Name,
    int OrderIndex,
    List<RoutineExerciseDetailDto> Exercises
);

/// <summary>
/// Plantilla de rutina activa asignada al alumno autenticado.
/// </summary>
/// <param name="Id">Identificador de la plantilla.</param>
/// <param name="Title">Título de la rutina (ej. "Fuerza e Hipertrofia 3 Días").</param>
/// <param name="Description">Descripción y recomendaciones generales del entrenador.</param>
/// <param name="Days">Días o sesiones de entrenamiento configuradas.</param>
public record ActiveRoutineResponse(
    Guid Id,
    string Title,
    string? Description,
    List<RoutineDayDetailDto> Days
);
