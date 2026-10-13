using GymApp.Api.Common;
using GymApp.Api.Database;
using GymApp.Api.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Workouts.SyncWorkoutSessions;

public interface ISyncWorkoutSessionsHandler
{
    Task<Result<SyncWorkoutBatchResponse>> HandleAsync(
        SyncWorkoutBatchRequest request,
        Guid userId,
        CancellationToken ct);
}

public class SyncWorkoutSessionsHandler : ISyncWorkoutSessionsHandler
{
    private readonly GymAppDbContext _db;

    public SyncWorkoutSessionsHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<SyncWorkoutBatchResponse>> HandleAsync(
        SyncWorkoutBatchRequest request,
        Guid userId,
        CancellationToken ct)
    {
        var student = await _db.Students
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (student is null)
        {
            return Result<SyncWorkoutBatchResponse>.NotFound("Perfil de alumno no encontrado.");
        }

        var results = new List<SyncResultItem>();
        var newSessions = new List<WorkoutSession>();

        // Extraer todas las claves de idempotencia para comprobar duplicados en un único viaje a BD
        var incomingKeys = request.Sessions.Select(s => s.IdempotencyKey).ToList();
        var existingKeys = await _db.WorkoutSessions
            .AsNoTracking()
            .Where(ws => incomingKeys.Contains(ws.IdempotencyKey))
            .Select(ws => ws.IdempotencyKey)
            .ToListAsync(ct);

        var existingKeySet = existingKeys.ToHashSet();

        foreach (var sessionPayload in request.Sessions)
        {
            // Regla constitucional de idempotencia: Client-Wins sin duplicación
            if (existingKeySet.Contains(sessionPayload.IdempotencyKey))
            {
                results.Add(new SyncResultItem(
                    sessionPayload.IdempotencyKey,
                    "ALREADY_EXISTS",
                    "Sesión previamente registrada. Se preserva el registro original."
                ));
                continue;
            }

            // Crear agregado de sesión con invariantes encapsuladas
            var sessionEntity = WorkoutSession.CreateCompleted(
                sessionPayload.IdempotencyKey,
                student.Id,
                sessionPayload.RoutineDayId,
                sessionPayload.StartedAt,
                sessionPayload.CompletedAt,
                sessionPayload.RpeScore,
                sessionPayload.StudentNotes
            );

            foreach (var setLog in sessionPayload.Sets)
            {
                sessionEntity.AddLog(
                    setLog.ExerciseId,
                    setLog.SetNumber,
                    setLog.ActualReps,
                    setLog.ActualWeightKg,
                    setLog.IsCompleted,
                    sessionPayload.CompletedAt
                );
            }

            newSessions.Add(sessionEntity);
            results.Add(new SyncResultItem(
                sessionPayload.IdempotencyKey,
                "CREATED",
                "Sesión persistida exitosamente."
            ));
        }

        if (newSessions.Count > 0)
        {
            _db.WorkoutSessions.AddRange(newSessions);
            await _db.SaveChangesAsync(ct);
        }

        return Result<SyncWorkoutBatchResponse>.Success(new SyncWorkoutBatchResponse(newSessions.Count, results));
    }
}
