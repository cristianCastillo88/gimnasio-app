using GymApp.Api.Common;
using GymApp.Api.Database;
using GymApp.Api.Database.Entities;
using GymApp.Api.Features.Students.GetActiveRoutine;
using Microsoft.EntityFrameworkCore;


namespace GymApp.Api.Features.Trainer.Routines;

public interface IUpdateRoutineTemplateHandler
{
    Task<Result<ActiveRoutineResponse>> HandleAsync(
        Guid id,
        UpdateRoutineTemplateRequest request,
        Guid trainerId,
        CancellationToken ct);
}

public class UpdateRoutineTemplateHandler : IUpdateRoutineTemplateHandler
{
    private readonly GymAppDbContext _db;

    public UpdateRoutineTemplateHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<ActiveRoutineResponse>> HandleAsync(
        Guid id,
        UpdateRoutineTemplateRequest request,
        Guid trainerId,
        CancellationToken ct)
    {
        // 1. Obtener la plantilla existente para validar pertenencia y actualizar cabecera
        var template = await _db.RoutineTemplates
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (template == null)
        {
            return Result<ActiveRoutineResponse>.NotFound(
                "La plantilla de rutina especificada no existe.",
                "Rutina no encontrada"
            );
        }

        // 2. Validar pertenencia del recurso
        if (template.TrainerId != trainerId)
        {
            return Result<ActiveRoutineResponse>.Forbidden(
                "No tienes autorización para modificar una rutina que pertenece a otro entrenador."
            );
        }

        // 3. Extraer y validar integridad referencial de todos los ExerciseId en la biblioteca del entrenador
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
            var missingIds = exerciseIds.Where(eid => !validExerciseMap.ContainsKey(eid)).ToList();
            return Result<ActiveRoutineResponse>.BadRequest(
                $"Uno o más ejercicios no existen en su biblioteca o pertenecen a otro entrenador: {string.Join(", ", missingIds)}",
                "Ejercicios inválidos"
            );
        }

        // 4. Actualizar cabecera de la plantilla
        template.UpdateDetails(request.Title, request.Description);

        // 5. Eliminar días antiguos y sus ejercicios
        var oldDays = await _db.RoutineDays
            .Where(d => d.TemplateId == template.Id)
            .ToListAsync(ct);

        _db.RoutineDays.RemoveRange(oldDays);

        // 6. Instanciar los nuevos días y ejercicios estructurados
        var newDays = new List<RoutineDay>();
        foreach (var dayDto in request.Days)
        {
            var day = new RoutineDay
            {
                Id = Guid.NewGuid(),
                TemplateId = template.Id,
                Name = dayDto.Name.Trim(),
                OrderIndex = dayDto.OrderIndex
            };

            foreach (var exDto in dayDto.Exercises)
            {
                day.AddExercise(
                    exDto.ExerciseId,
                    exDto.OrderIndex,
                    exDto.TargetSets,
                    exDto.TargetReps,
                    exDto.SuggestedWeightKg,
                    exDto.SuggestedRestSeconds,
                    exDto.Notes
                );
            }

            newDays.Add(day);
        }

        _db.RoutineDays.AddRange(newDays);
        template.Days = newDays;

        // 7. Persistir cambios atómicamente
        await _db.SaveChangesAsync(ct);

        // 8. Retornar modelo proyectado
        var response = template.ToResponse(validExerciseMap);
        return Result<ActiveRoutineResponse>.Success(response);
    }


}
