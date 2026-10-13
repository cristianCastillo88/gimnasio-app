using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Auth.Activation;

public interface IVerifyActivationTokenHandler
{
    Task<Result<VerifyActivationTokenResponse>> HandleAsync(string token, CancellationToken ct);
}

public class VerifyActivationTokenHandler : IVerifyActivationTokenHandler
{
    private readonly GymAppDbContext _db;

    public VerifyActivationTokenHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<VerifyActivationTokenResponse>> HandleAsync(string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Result<VerifyActivationTokenResponse>.BadRequest(
                "El token proporcionado no es válido.",
                "Token inválido");
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                u.ActivationToken == token &&
                u.ActivationTokenExpiresAt.HasValue &&
                u.ActivationTokenExpiresAt > DateTimeOffset.UtcNow,
                ct);

        if (user is null)
        {
            return Result<VerifyActivationTokenResponse>.NotFound(
                "El enlace de activación es inválido o ha expirado. Solicita a tu entrenador que te reenvíe la invitación.",
                "Enlace expirado o no encontrado");
        }

        return Result<VerifyActivationTokenResponse>.Success(
            new VerifyActivationTokenResponse(user.FullName, user.Email)
        );
    }
}
