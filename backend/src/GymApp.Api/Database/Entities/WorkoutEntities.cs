namespace GymApp.Api.Database.Entities;

public class WorkoutSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid IdempotencyKey { get; set; } = Guid.NewGuid(); // Clave de idempotencia única del cliente

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public Guid? RoutineDayId { get; set; }
    public RoutineDay? RoutineDay { get; set; }

    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset CompletedAt { get; set; }
    public int RpeScore { get; set; } = 7; // 1 a 10
    public string? StudentNotes { get; set; }
    public bool IsSynced { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Relaciones
    public ICollection<WorkoutLog> Logs { get; set; } = new List<WorkoutLog>();

    // Comportamiento de Dominio
    public static WorkoutSession CreateCompleted(
        Guid idempotencyKey,
        Guid studentId,
        Guid? routineDayId,
        DateTimeOffset startedAt,
        DateTimeOffset completedAt,
        int rpeScore,
        string? studentNotes)
    {
        if (rpeScore is < 1 or > 10)
        {
            throw new ArgumentOutOfRangeException(nameof(rpeScore), "El RPE debe estar comprendido entre 1 y 10.");
        }

        return new WorkoutSession
        {
            Id = Guid.NewGuid(),
            IdempotencyKey = idempotencyKey,
            StudentId = studentId,
            RoutineDayId = routineDayId,
            StartedAt = startedAt,
            CompletedAt = completedAt,
            RpeScore = rpeScore,
            StudentNotes = studentNotes?.Trim(),
            IsSynced = true,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public WorkoutLog AddLog(
        Guid exerciseId,
        int setNumber,
        int actualReps,
        decimal actualWeightKg,
        bool isCompleted,
        DateTimeOffset? completedAt = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(setNumber, nameof(setNumber));
        ArgumentOutOfRangeException.ThrowIfNegative(actualReps, nameof(actualReps));
        ArgumentOutOfRangeException.ThrowIfNegative(actualWeightKg, nameof(actualWeightKg));

        var log = new WorkoutLog
        {
            Id = Guid.NewGuid(),
            SessionId = Id,
            Session = this,
            ExerciseId = exerciseId,
            SetNumber = setNumber,
            ActualReps = actualReps,
            ActualWeightKg = actualWeightKg,
            IsCompleted = isCompleted,
            CompletedAt = completedAt ?? CompletedAt
        };

        Logs.Add(log);
        return log;
    }
}

public class WorkoutLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid SessionId { get; set; }
    public WorkoutSession Session { get; set; } = null!;

    public Guid ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;

    public int SetNumber { get; set; }
    public int ActualReps { get; set; }
    public decimal ActualWeightKg { get; set; }
    public bool IsCompleted { get; set; } = true;
    public DateTimeOffset CompletedAt { get; set; } = DateTimeOffset.UtcNow;
}
