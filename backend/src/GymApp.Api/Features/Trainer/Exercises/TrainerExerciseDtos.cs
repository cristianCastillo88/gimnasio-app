namespace GymApp.Api.Features.Trainer.Exercises;

/// <summary>
/// Ejercicio registrado en la biblioteca personal del entrenador.
/// </summary>
/// <param name="Id">Identificador único del ejercicio.</param>
/// <param name="Name">Nombre del ejercicio (ej. "Press de Banca Plano").</param>
/// <param name="MuscleGroup">Grupo muscular principal (Pecho, Espalda, Piernas, etc.).</param>
/// <param name="MovementPattern">Patrón biomecánico (Empuje horizontal, Tracción vertical, etc.).</param>
/// <param name="VideoUrl">URL del video demostrativo.</param>
/// <param name="ExecutionTips">Puntos clave de técnica y postura.</param>
public record ExerciseDto(
    Guid Id,
    string Name,
    string MuscleGroup,
    string? MovementPattern = null,
    string? VideoUrl = null,
    string? ExecutionTips = null
);

/// <summary>
/// Solicitud de alta de un nuevo ejercicio en la biblioteca del entrenador.
/// </summary>
/// <param name="Name">Nombre del ejercicio.</param>
/// <param name="MuscleGroup">Grupo muscular principal.</param>
/// <param name="MovementPattern">Patrón de movimiento.</param>
/// <param name="VideoUrl">URL del video explicativo.</param>
/// <param name="ExecutionTips">Recomendaciones técnicas y de seguridad.</param>
public record CreateExerciseRequest(
    string Name,
    string MuscleGroup,
    string? MovementPattern = null,
    string? VideoUrl = null,
    string? ExecutionTips = null
);

/// <summary>
/// Solicitud para actualizar un ejercicio existente en la biblioteca del entrenador.
/// </summary>
/// <param name="Name">Nombre del ejercicio.</param>
/// <param name="MuscleGroup">Grupo muscular principal.</param>
/// <param name="MovementPattern">Patrón de movimiento biomecánico.</param>
/// <param name="VideoUrl">URL del video explicativo.</param>
/// <param name="ExecutionTips">Recomendaciones técnicas y de postura.</param>
public record UpdateExerciseRequest(
    string Name,
    string MuscleGroup,
    string? MovementPattern = null,
    string? VideoUrl = null,
    string? ExecutionTips = null
);

