using GymApp.Api.Database.Entities;
using GymApp.Api.Features.Students.GetActiveRoutine;

namespace GymApp.Api.Features.Trainer.Routines;

public static class TrainerRoutineMappers
{
    public static RoutineTemplate ToEntity(this CreateRoutineTemplateRequest request, Guid trainerId)
    {
        var template = RoutineTemplate.Create(trainerId, request.Title, request.Description);

        foreach (var dayDto in request.Days)
        {
            var day = template.AddDay(dayDto.Name, dayDto.OrderIndex);

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
        }

        return template;
    }

    public static ActiveRoutineResponse ToResponse(this RoutineTemplate template, IReadOnlyDictionary<Guid, Exercise> exerciseMap)
    {
        var daysResponse = template.Days.OrderBy(d => d.OrderIndex).Select(d => new RoutineDayDetailDto(
            d.Id,
            d.Name,
            d.OrderIndex,
            d.RoutineExercises.OrderBy(re => re.OrderIndex).Select(re =>
            {
                var ex = exerciseMap.GetValueOrDefault(re.ExerciseId);
                return new RoutineExerciseDetailDto(
                    re.Id,
                    re.ExerciseId,
                    ex?.Name ?? "Ejercicio",
                    ex?.MuscleGroup ?? "General",
                    re.TargetSets,
                    re.TargetReps,
                    re.SuggestedWeightKg,
                    re.SuggestedRestSeconds,
                    ex?.VideoUrl,
                    ex?.ExecutionTips
                );
            }).ToList()
        )).ToList();

        return new ActiveRoutineResponse(
            template.Id,
            template.Title,
            template.Description,
            daysResponse
        );
    }
}
