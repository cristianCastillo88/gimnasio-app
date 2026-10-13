using GymApp.Api.Common;
using GymApp.Api.Common.Security;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Auth.ChangePassword;

public interface IChangePasswordHandler
{
    Task<Result<string>> HandleAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct);
}

public class ChangePasswordHandler : IChangePasswordHandler
{
    private readonly GymAppDbContext _db;
    private readonly ISecurityAuditLogger _auditLogger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ChangePasswordHandler(
        GymAppDbContext db,
        ISecurityAuditLogger auditLogger,
        IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _auditLogger = auditLogger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<string>> HandleAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct)
    {
        var clientIp = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
        {
            return Result<string>.NotFound("Usuario no encontrado.");
        }

        if (!user.VerifyPassword(request.CurrentPassword))
        {
            _auditLogger.LogFailedLogin(user.Email, clientIp, "Intento de cambio de contraseña con clave actual incorrecta");
            return Result<string>.Unauthorized(
                "La contraseña actual ingresada es incorrecta.",
                "Contraseña actual incorrecta");
        }

        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.ChangePassword(newPasswordHash);

        await _db.SaveChangesAsync(ct);
        _auditLogger.LogAccountActivated(user.Id, user.Email, clientIp);

        return Result<string>.Success("Contraseña actualizada exitosamente.");
    }
}
