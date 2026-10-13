using FluentValidation;
using GymApp.Api.Database.Entities;

namespace GymApp.Api.Features.Trainer.Students;

public class CreateStudentValidator : AbstractValidator<CreateStudentRequest>
{
    public CreateStudentValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("El nombre completo es obligatorio.")
            .MinimumLength(3).WithMessage("El nombre debe tener al menos 3 caracteres.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("El email es obligatorio.")
            .EmailAddress().WithMessage("El formato del email es inválido.");

        RuleFor(x => x.PhoneWhatsapp)
            .NotEmpty().WithMessage("El teléfono de WhatsApp es obligatorio.");

        RuleFor(x => x.SessionsRemaining)
            .GreaterThanOrEqualTo(0).WithMessage("Las sesiones restantes no pueden ser negativas.");
    }
}

public class UpdateSubscriptionValidator : AbstractValidator<UpdateSubscriptionRequest>
{
    public UpdateSubscriptionValidator()
    {
        RuleFor(x => x.SubscriptionStatus)
            .NotEmpty().WithMessage("El estado de suscripción es requerido.")
            .Must(s => Enum.TryParse<SubscriptionStatus>(s, true, out _))
            .WithMessage("Estado de suscripción inválido. Valores válidos: ACTIVE, PENDING, EXPIRED.");
    }
}
