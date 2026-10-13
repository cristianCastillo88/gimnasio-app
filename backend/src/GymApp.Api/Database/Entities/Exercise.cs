namespace GymApp.Api.Database.Entities;

public class Exercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }
    public User Trainer { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string MuscleGroup { get; set; } = string.Empty;
    public string? MovementPattern { get; set; }
    public string? VideoUrl { get; set; }
    public string? ExecutionTips { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Relaciones
    public ICollection<RoutineExercise> RoutineExercises { get; set; } = new List<RoutineExercise>();
    public ICollection<WorkoutLog> WorkoutLogs { get; set; } = new List<WorkoutLog>();

    // Comportamiento de Dominio
    public static Exercise Create(
        Guid trainerId,
        string name,
        string muscleGroup,
        string? movementPattern,
        string? videoUrl,
        string? executionTips)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name, nameof(name));
        ArgumentException.ThrowIfNullOrWhiteSpace(muscleGroup, nameof(muscleGroup));

        return new Exercise
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerId,
            Name = name.Trim(),
            MuscleGroup = muscleGroup.Trim(),
            MovementPattern = movementPattern?.Trim(),
            VideoUrl = videoUrl?.Trim(),
            ExecutionTips = executionTips?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string name,
        string muscleGroup,
        string? movementPattern,
        string? videoUrl,
        string? executionTips)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name, nameof(name));
        ArgumentException.ThrowIfNullOrWhiteSpace(muscleGroup, nameof(muscleGroup));

        Name = name.Trim();
        MuscleGroup = muscleGroup.Trim();
        MovementPattern = movementPattern?.Trim();
        VideoUrl = videoUrl?.Trim();
        ExecutionTips = executionTips?.Trim();
    }
}
