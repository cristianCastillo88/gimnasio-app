namespace GymApp.Api.Features.Exercises.GetExerciseHistory;

public record ExerciseLogItem(
    DateTimeOffset CompletedAt,
    int SetNumber,
    int ActualReps,
    decimal ActualWeightKg
);

public static class GetExerciseHistoryMappers
{
    /// <summary>
    /// Agrupa registros de series completadas por fecha de sesión y proyecta las últimas 5 sesiones.
    /// </summary>
    public static ExerciseHistoryResponse ToHistoryResponse(
        this IEnumerable<ExerciseLogItem> logs,
        Guid exerciseId,
        int maxSessions = 5)
    {
        var groupedLogs = logs
            .GroupBy(l => l.CompletedAt)
            .Take(maxSessions)
            .Select(g => new SessionHistoryItemDto(
                g.Key,
                g.Select(s => new SetHistoryDto(s.SetNumber, s.ActualReps, s.ActualWeightKg)).ToList()
            ))
            .ToList();

        return new ExerciseHistoryResponse(exerciseId, groupedLogs);
    }
}
