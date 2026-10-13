using GymApp.Api.Database.Entities;

namespace GymApp.Api.Features.Students.GetActiveRoutine;

public static class GetActiveRoutineMappers
{
    /// <summary>
    /// Mapea el agregado de RoutineTemplate cargado con sus días y ejercicios al DTO ActiveRoutineResponse,
    /// enriqueciendo cada ejercicio con su rendimiento previo registrado si estuviera disponible.
    /// </summary>
    public static ActiveRoutineResponse ToResponse(
        this RoutineTemplate template,
        IReadOnlyDictionary<Guid, PreviousPerformanceDto> previousHistoryMap)
    {
        var daysDto = template.Days.OrderBy(d => d.OrderIndex).Select(d => new RoutineDayDetailDto(
            d.Id,
            d.Name,
            d.OrderIndex,
            d.RoutineExercises.OrderBy(re => re.OrderIndex).Select(re => new RoutineExerciseDetailDto(
                re.Id,
                re.ExerciseId,
                re.Exercise.Name,
                re.Exercise.MuscleGroup,
                re.TargetSets,
                re.TargetReps,
                re.SuggestedWeightKg,
                re.SuggestedRestSeconds,
                re.Exercise.VideoUrl,
                re.Exercise.ExecutionTips,
                previousHistoryMap.GetValueOrDefault(re.ExerciseId)
            )).ToList()
        )).ToList();

        return new ActiveRoutineResponse(
            template.Id,
            template.Title,
            template.Description,
            daysDto
        );
    }
}
