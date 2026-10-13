using FluentValidation;

namespace GymApp.Api.Features.Trainer.Routines;

public class CreateRoutineTemplateValidator : AbstractValidator<CreateRoutineTemplateRequest>
{
    public CreateRoutineTemplateValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("El título de la rutina es obligatorio.")
            .MaximumLength(120).WithMessage("El título no puede exceder 120 caracteres.");

        RuleFor(x => x.Days)
            .NotNull()
            .NotEmpty().WithMessage("La rutina debe tener al menos un día programado.");

        RuleForEach(x => x.Days).SetValidator(new CreateRoutineDayValidator());
    }
}

public class UpdateRoutineTemplateValidator : AbstractValidator<UpdateRoutineTemplateRequest>
{
    public UpdateRoutineTemplateValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("El título de la rutina es obligatorio.")
            .MaximumLength(120).WithMessage("El título no puede exceder 120 caracteres.");

        RuleFor(x => x.Days)
            .NotNull()
            .NotEmpty().WithMessage("La rutina debe tener al menos un día programado.");

        RuleForEach(x => x.Days).SetValidator(new CreateRoutineDayValidator());
    }
}

public class CreateRoutineDayValidator : AbstractValidator<CreateRoutineDayDto>

{
    public CreateRoutineDayValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre de la sesión (ej. 'Día A') es obligatorio.");

        RuleFor(x => x.OrderIndex)
            .GreaterThan(0).WithMessage("El índice de orden debe ser mayor a 0.");

        RuleFor(x => x.Exercises)
            .NotNull()
            .NotEmpty().WithMessage("Cada día de rutina debe contener al menos un ejercicio.");

        RuleForEach(x => x.Exercises).SetValidator(new CreateRoutineExerciseValidator());
    }
}

public class CreateRoutineExerciseValidator : AbstractValidator<CreateRoutineExerciseDto>
{
    public CreateRoutineExerciseValidator()
    {
        RuleFor(x => x.ExerciseId)
            .NotEmpty().WithMessage("El ID de ejercicio es obligatorio.");

        RuleFor(x => x.TargetSets)
            .GreaterThan(0).WithMessage("Las series objetivo deben ser mayor a 0.");

        RuleFor(x => x.TargetReps)
            .NotEmpty().WithMessage("El rango de repeticiones objetivo es obligatorio.");

        RuleFor(x => x.SuggestedRestSeconds)
            .GreaterThanOrEqualTo(0).WithMessage("El descanso sugerido no puede ser negativo.");
    }
}

public class AssignRoutineValidator : AbstractValidator<AssignRoutineRequest>
{
    public AssignRoutineValidator()
    {
        RuleFor(x => x.StudentId).NotEmpty().WithMessage("El ID del alumno es obligatorio.");
        RuleFor(x => x.RoutineTemplateId).NotEmpty().WithMessage("El ID de la plantilla de rutina es obligatorio.");
    }
}
