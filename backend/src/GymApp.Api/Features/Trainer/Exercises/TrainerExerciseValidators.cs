using FluentValidation;

namespace GymApp.Api.Features.Trainer.Exercises;

public class CreateExerciseValidator : AbstractValidator<CreateExerciseRequest>
{
    public CreateExerciseValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre del ejercicio es obligatorio.")
            .MaximumLength(120).WithMessage("El nombre no puede exceder 120 caracteres.");

        RuleFor(x => x.MuscleGroup)
            .NotEmpty().WithMessage("El grupo muscular es obligatorio.")
            .MaximumLength(60).WithMessage("El grupo muscular no puede exceder 60 caracteres.");
    }
}

public class UpdateExerciseValidator : AbstractValidator<UpdateExerciseRequest>
{
    public UpdateExerciseValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("El nombre del ejercicio es obligatorio.")
            .MaximumLength(120).WithMessage("El nombre no puede exceder 120 caracteres.");

        RuleFor(x => x.MuscleGroup)
            .NotEmpty().WithMessage("El grupo muscular es obligatorio.")
            .MaximumLength(60).WithMessage("El grupo muscular no puede exceder 60 caracteres.");
    }
}

