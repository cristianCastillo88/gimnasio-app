using FluentValidation;

namespace GymApp.Api.Features.Workouts.SyncWorkoutSessions;

public class SyncWorkoutBatchValidator : AbstractValidator<SyncWorkoutBatchRequest>
{
    public SyncWorkoutBatchValidator()
    {
        RuleFor(x => x.Sessions)
            .NotNull().WithMessage("El lote de sesiones no puede ser nulo.")
            .NotEmpty().WithMessage("Debe incluir al menos una sesión para sincronizar.");

        RuleForEach(x => x.Sessions).SetValidator(new WorkoutSessionPayloadValidator());
    }
}

public class WorkoutSessionPayloadValidator : AbstractValidator<WorkoutSessionPayload>
{
    public WorkoutSessionPayloadValidator()
    {
        RuleFor(x => x.IdempotencyKey)
            .NotEmpty().WithMessage("La clave de idempotencia es obligatoria.");

        RuleFor(x => x.StartedAt)
            .NotEmpty().WithMessage("La fecha de inicio es requerida.");

        RuleFor(x => x.CompletedAt)
            .NotEmpty().WithMessage("La fecha de finalización es requerida.")
            .GreaterThanOrEqualTo(x => x.StartedAt)
            .WithMessage("La fecha de finalización no puede ser previa al inicio.");

        RuleFor(x => x.RpeScore)
            .InclusiveBetween(1, 10)
            .WithMessage("La puntuación RPE debe estar comprendida entre 1 y 10.");

        RuleFor(x => x.Sets)
            .NotNull()
            .NotEmpty().WithMessage("La sesión debe contener al menos un registro de serie.");

        RuleForEach(x => x.Sets).SetValidator(new WorkoutSetLogPayloadValidator());
    }
}

public class WorkoutSetLogPayloadValidator : AbstractValidator<WorkoutSetLogPayload>
{
    public WorkoutSetLogPayloadValidator()
    {
        RuleFor(x => x.ExerciseId)
            .NotEmpty().WithMessage("El ID de ejercicio es obligatorio.");

        RuleFor(x => x.SetNumber)
            .GreaterThan(0).WithMessage("El número de serie debe ser mayor a 0.");

        RuleFor(x => x.ActualReps)
            .GreaterThanOrEqualTo(0).WithMessage("Las repeticiones reales no pueden ser negativas.");

        RuleFor(x => x.ActualWeightKg)
            .GreaterThanOrEqualTo(0).WithMessage("El peso real no puede ser negativo.");
    }
}
