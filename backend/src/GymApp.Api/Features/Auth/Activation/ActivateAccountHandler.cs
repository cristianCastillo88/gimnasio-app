using GymApp.Api.Common;
using GymApp.Api.Common.Auth;
using GymApp.Api.Database;
using GymApp.Api.Features.Auth.Login;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Auth.Activation;

public interface IActivateAccountHandler
{
    Task<Result<AuthResponse>> HandleAsync(ActivateAccountRequest request, CancellationToken ct);
}

public class ActivateAccountHandler : IActivateAccountHandler
{
    private readonly GymAppDbContext _db;
    private readonly IJwtTokenService _jwtService;
    private readonly GymApp.Api.Common.Security.ISecurityAuditLogger _auditLogger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ActivateAccountHandler(
        GymAppDbContext db,
        IJwtTokenService jwtService,
        GymApp.Api.Common.Security.ISecurityAuditLogger auditLogger,
        IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _jwtService = jwtService;
        _auditLogger = auditLogger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<AuthResponse>> HandleAsync(ActivateAccountRequest request, CancellationToken ct)
    {
        var clientIp = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var user = await _db.Users
            .Include(u => u.StudentProfile)
            .FirstOrDefaultAsync(u =>
                u.ActivationToken == request.Token &&
                u.ActivationTokenExpiresAt.HasValue &&
                u.ActivationTokenExpiresAt > DateTimeOffset.UtcNow,
                ct);

        if (user is null)
        {
            _auditLogger.LogInvalidActivationToken(request.Token, clientIp);
            return Result<AuthResponse>.NotFound(
                "El enlace de activación es inválido o ha expirado. Solicita a tu entrenador un nuevo enlace.",
                "Enlace inválido o expirado");
        }

        // 1. Hashear y asignar la nueva contraseña elegida por el alumno
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.ActivateWithPassword(passwordHash);

        await _db.SaveChangesAsync(ct);
        _auditLogger.LogAccountActivated(user.Id, user.Email, clientIp);

        // 2. Generar token JWT para autologin inmediato sin fricción
        var studentId = user.StudentProfile?.Id;
        var token = _jwtService.GenerateToken(user, studentId);

        var userProfile = new UserProfileDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString().ToUpperInvariant(),
            user.PhoneWhatsapp,
            studentId
        );

        return Result<AuthResponse>.Success(new AuthResponse(token, userProfile));
    }
}
