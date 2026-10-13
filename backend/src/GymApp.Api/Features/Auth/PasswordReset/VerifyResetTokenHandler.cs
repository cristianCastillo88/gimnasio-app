using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Auth.PasswordReset;

public interface IVerifyResetTokenHandler
{
    Task<Result<VerifyResetTokenResponse>> HandleAsync(string token, CancellationToken ct);
}

public class VerifyResetTokenHandler : IVerifyResetTokenHandler
{
    private readonly GymAppDbContext _db;

    public VerifyResetTokenHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<VerifyResetTokenResponse>> HandleAsync(string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Result<VerifyResetTokenResponse>.BadRequest(
                "El token proporcionado no es válido.",
                "Token inválido");
        }

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                u.PasswordResetToken == token &&
                u.PasswordResetTokenExpiresAt.HasValue &&
                u.PasswordResetTokenExpiresAt > DateTimeOffset.UtcNow,
                ct);

        if (user is null)
        {
            return Result<VerifyResetTokenResponse>.NotFound(
                "El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.",
                "Enlace expirado o no encontrado");
        }

        return Result<VerifyResetTokenResponse>.Success(
            new VerifyResetTokenResponse(user.Email, user.FullName)
        );
    }
}
