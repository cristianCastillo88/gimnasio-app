namespace GymApp.Api.Database.Entities;

public class Student
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid TrainerId { get; set; }
    public User Trainer { get; set; } = null!;

    public string? MedicalNotes { get; set; }
    public string? FitnessGoals { get; set; }
    public SubscriptionStatus SubscriptionStatus { get; set; } = SubscriptionStatus.Active;
    public int SessionsRemaining { get; set; } = 0;
    public DateOnly? NextBillingDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Relaciones
    public ICollection<RoutineAssignment> RoutineAssignments { get; set; } = new List<RoutineAssignment>();
    public ICollection<WorkoutSession> WorkoutSessions { get; set; } = new List<WorkoutSession>();

    // Comportamiento de Dominio
    public static Student Create(
        Guid userId,
        Guid trainerId,
        string? medicalNotes,
        string? fitnessGoals,
        int sessionsRemaining,
        DateOnly? nextBillingDate = null)
    {
        return new Student
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TrainerId = trainerId,
            MedicalNotes = medicalNotes?.Trim(),
            FitnessGoals = fitnessGoals?.Trim(),
            SubscriptionStatus = SubscriptionStatus.Active,
            SessionsRemaining = Math.Max(0, sessionsRemaining),
            NextBillingDate = nextBillingDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void UpdateSubscription(
        SubscriptionStatus status,
        int? sessionsRemainingDelta,
        DateOnly? nextBillingDate)
    {
        SubscriptionStatus = status;
        if (sessionsRemainingDelta.HasValue)
        {
            SessionsRemaining = Math.Max(0, SessionsRemaining + sessionsRemainingDelta.Value);
        }
        if (nextBillingDate.HasValue)
        {
            NextBillingDate = nextBillingDate.Value;
        }
    }
}
