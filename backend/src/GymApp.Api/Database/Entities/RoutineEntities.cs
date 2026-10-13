namespace GymApp.Api.Database.Entities;

public class RoutineTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TrainerId { get; set; }
    public User Trainer { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Relaciones
    public ICollection<RoutineDay> Days { get; set; } = new List<RoutineDay>();
    public ICollection<RoutineAssignment> Assignments { get; set; } = new List<RoutineAssignment>();

    // Comportamiento de Dominio
    public static RoutineTemplate Create(Guid trainerId, string title, string? description)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title, nameof(title));

        return new RoutineTemplate
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerId,
            Title = title.Trim(),
            Description = description?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public RoutineDay AddDay(string name, int orderIndex)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name, nameof(name));

        var day = new RoutineDay
        {
            Id = Guid.NewGuid(),
            TemplateId = Id,
            Template = this,
            Name = name.Trim(),
            OrderIndex = orderIndex
        };

        Days.Add(day);
        return day;
    }

    public void UpdateDetails(string title, string? description)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title, nameof(title));
        Title = title.Trim();
        Description = description?.Trim();
    }
}

public class RoutineDay
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TemplateId { get; set; }
    public RoutineTemplate Template { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public int OrderIndex { get; set; } = 0;

    // Relaciones
    public ICollection<RoutineExercise> RoutineExercises { get; set; } = new List<RoutineExercise>();
    public ICollection<WorkoutSession> WorkoutSessions { get; set; } = new List<WorkoutSession>();

    // Comportamiento de Dominio
    public RoutineExercise AddExercise(
        Guid exerciseId,
        int orderIndex,
        int targetSets,
        string targetReps,
        decimal? suggestedWeightKg = null,
        int suggestedRestSeconds = 90,
        string? notes = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(targetSets, nameof(targetSets));
        ArgumentException.ThrowIfNullOrWhiteSpace(targetReps, nameof(targetReps));

        var routineEx = new RoutineExercise
        {
            Id = Guid.NewGuid(),
            RoutineDayId = Id,
            RoutineDay = this,
            ExerciseId = exerciseId,
            OrderIndex = orderIndex,
            TargetSets = targetSets,
            TargetReps = targetReps.Trim(),
            SuggestedWeightKg = suggestedWeightKg,
            SuggestedRestSeconds = suggestedRestSeconds > 0 ? suggestedRestSeconds : 90,
            Notes = notes?.Trim()
        };

        RoutineExercises.Add(routineEx);
        return routineEx;
    }
}

public class RoutineExercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RoutineDayId { get; set; }
    public RoutineDay RoutineDay { get; set; } = null!;

    public Guid ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;

    public int OrderIndex { get; set; } = 0;
    public int TargetSets { get; set; } = 3;
    public string TargetReps { get; set; } = "8-10";
    public decimal? SuggestedWeightKg { get; set; }
    public int SuggestedRestSeconds { get; set; } = 90;
    public string? Notes { get; set; }
}

public class RoutineAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public Guid RoutineTemplateId { get; set; }
    public RoutineTemplate RoutineTemplate { get; set; } = null!;

    public DateTimeOffset AssignedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsActive { get; set; } = true;

    // Comportamiento de Dominio
    public static RoutineAssignment CreateActive(Guid studentId, Guid routineTemplateId)
    {
        return new RoutineAssignment
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            RoutineTemplateId = routineTemplateId,
            AssignedAt = DateTimeOffset.UtcNow,
            IsActive = true
        };
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}
