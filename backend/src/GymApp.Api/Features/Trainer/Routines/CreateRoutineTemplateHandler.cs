using GymApp.Api.Common;
using GymApp.Api.Database;
using GymApp.Api.Features.Students.GetActiveRoutine;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Routines;

public interface ICreateRoutineTemplateHandler
{
    Task<Result<ActiveRoutineResponse>> HandleAsync(
        CreateRoutineTemplateRequest request,
        Guid trainerId,
        CancellationToken ct);
}

public class CreateRoutineTemplateHandler : ICreateRoutineTemplateHandler
{
    private readonly GymAppDbContext _db;

    public CreateRoutineTemplateHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<ActiveRoutineResponse>> HandleAsync(
        CreateRoutineTemplateRequest request,
        Guid trainerId,
        CancellationToken ct)
    {
        // 1. Extraer y validar integridad referencial de todos los ExerciseId enviados
        var exerciseIds = request.Days
            .SelectMany(d => d.Exercises.Select(e => e.ExerciseId))
            .Distinct()
            .ToList();

        var validExerciseMap = await _db.Exercises
            .AsNoTracking()
            .Where(e => exerciseIds.Contains(e.Id) && e.TrainerId == trainerId)
            .ToDictionaryAsync(e => e.Id, e => e, ct);

        if (validExerciseMap.Count != exerciseIds.Count)
        {
            var missingIds = exerciseIds.Where(id => !validExerciseMap.ContainsKey(id)).ToList();
            return Result<ActiveRoutineResponse>.BadRequest(
                $"Uno o más ejercicios no existen en su biblioteca o pertenecen a otro entrenador: {string.Join(", ", missingIds)}",
                "Ejercicios inválidos"
            );
        }

        // 2. Mapear request a agregado de entidad con invariantes de dominio
        var template = request.ToEntity(trainerId);

        _db.RoutineTemplates.Add(template);
        await _db.SaveChangesAsync(ct);

        // 3. Proyectar a DTO de respuesta
        var response = template.ToResponse(validExerciseMap);
        return Result<ActiveRoutineResponse>.Success(response);
    }
}
