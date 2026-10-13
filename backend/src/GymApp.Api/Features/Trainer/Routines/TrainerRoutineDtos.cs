namespace GymApp.Api.Features.Trainer.Routines;

/// <summary>
/// Configuración de un ejercicio al armar una rutina de entrenamiento.
/// </summary>
/// <param name="ExerciseId">Identificador del ejercicio en la biblioteca del entrenador.</param>
/// <param name="OrderIndex">Posición de ejecución en la sesión.</param>
/// <param name="TargetSets">Cantidad de series pautadas.</param>
/// <param name="TargetReps">Rango de repeticiones objetivo (ej. "10-12").</param>
/// <param name="SuggestedWeightKg">Carga sugerida en kg.</param>
/// <param name="SuggestedRestSeconds">Descanso recomendado entre series en segundos.</param>
/// <param name="Notes">Indicaciones técnicas específicas para el ejercicio.</param>
public record CreateRoutineExerciseDto(
    Guid ExerciseId,
    int OrderIndex,
    int TargetSets,
    string TargetReps,
    decimal? SuggestedWeightKg = null,
    int SuggestedRestSeconds = 90,
    string? Notes = null
);

/// <summary>
/// Configuración de una sesión o día dentro de la plantilla de rutina.
/// </summary>
/// <param name="Name">Nombre descriptivo de la sesión (ej. "Día A: Tirón / Espalda").</param>
/// <param name="OrderIndex">Orden correlativo del día en la rutina.</param>
/// <param name="Exercises">Listado ordenado de ejercicios de la sesión.</param>
public record CreateRoutineDayDto(
    string Name,
    int OrderIndex,
    List<CreateRoutineExerciseDto> Exercises
);

/// <summary>
/// Petición para crear una nueva plantilla de rutina flexible.
/// </summary>
/// <param name="Title">Título identificador de la rutina.</param>
/// <param name="Description">Objetivo y notas generales de la planificación.</param>
/// <param name="Days">Días o sesiones que componen la rutina.</param>
public record CreateRoutineTemplateRequest(
    string Title,
    string? Description,
    List<CreateRoutineDayDto> Days
);

/// <summary>
/// Petición para actualizar una plantilla de rutina flexible existente.
/// </summary>
/// <param name="Title">Título identificador de la rutina.</param>
/// <param name="Description">Objetivo y notas generales de la planificación.</param>
/// <param name="Days">Días o sesiones que componen la rutina.</param>
public record UpdateRoutineTemplateRequest(
    string Title,
    string? Description,
    List<CreateRoutineDayDto> Days
);


/// <summary>
/// Resumen descriptivo de una plantilla de rutina creada por el entrenador.
/// </summary>
/// <param name="Id">Identificador único de la plantilla.</param>
/// <param name="Title">Título de la rutina.</param>
/// <param name="Description">Descripción y enfoque de la planificación.</param>
/// <param name="DaysCount">Cantidad de sesiones o días que componen la rutina.</param>
/// <param name="ExercisesCount">Cantidad total de ejercicios programados a lo largo de los días.</param>
/// <param name="ActiveStudentsCount">Cantidad de alumnos con esta rutina asignada activa.</param>
/// <param name="CreatedAt">Fecha y hora de creación.</param>
public record RoutineTemplateSummaryDto(
    Guid Id,
    string Title,
    string? Description,
    int DaysCount,
    int ExercisesCount,
    int ActiveStudentsCount,
    DateTimeOffset CreatedAt
);

/// <summary>
/// Petición para asignar una plantilla de rutina a un alumno específico.
/// </summary>
/// <param name="StudentId">Identificador del alumno a cargo del entrenador.</param>
/// <param name="RoutineTemplateId">Identificador de la plantilla a asociar.</param>
public record AssignRoutineRequest(
    Guid StudentId,
    Guid RoutineTemplateId
);

/// <summary>
/// Respuesta exitosa de asignación de rutina activa.
/// </summary>
/// <param name="Message">Mensaje informativo de la operación.</param>
/// <param name="StudentId">Identificador del alumno asignado.</param>
/// <param name="RoutineTemplateId">Identificador de la plantilla asignada.</param>
public record AssignRoutineResponse(
    string Message,
    Guid StudentId,
    Guid RoutineTemplateId
);
