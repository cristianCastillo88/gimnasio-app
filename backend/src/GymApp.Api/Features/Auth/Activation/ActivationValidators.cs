using FluentValidation;

namespace GymApp.Api.Features.Auth.Activation;

public class ActivateAccountRequestValidator : AbstractValidator<ActivateAccountRequest>
{
    public ActivateAccountRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("El token de activación es obligatorio.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("La contraseña es requerida.")
            .MinimumLength(8).WithMessage("La contraseña debe tener al menos 8 caracteres.")
            .Matches(@"[A-Z]").WithMessage("La contraseña debe contener al menos una letra mayúscula.")
            .Matches(@"[a-z]").WithMessage("La contraseña debe contener al menos una letra minúscula.")
            .Matches(@"[0-9]").WithMessage("La contraseña debe contener al menos un número.")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("La contraseña debe contener al menos un carácter especial.");
    }
}
