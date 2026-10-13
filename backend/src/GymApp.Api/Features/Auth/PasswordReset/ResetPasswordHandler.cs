using GymApp.Api.Common;
using GymApp.Api.Common.Auth;
using GymApp.Api.Common.Security;
using GymApp.Api.Database;
using GymApp.Api.Features.Auth.Login;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Auth.PasswordReset;

public interface IResetPasswordHandler
{
    Task<Result<AuthResponse>> HandleAsync(ResetPasswordRequest request, CancellationToken ct);
}

public class ResetPasswordHandler : IResetPasswordHandler
{
    private readonly GymAppDbContext _db;
    private readonly IJwtTokenService _jwtService;
    private readonly ISecurityAuditLogger _auditLogger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ResetPasswordHandler(
        GymAppDbContext db,
        IJwtTokenService jwtService,
        ISecurityAuditLogger auditLogger,
        IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _jwtService = jwtService;
        _auditLogger = auditLogger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<Result<AuthResponse>> HandleAsync(ResetPasswordRequest request, CancellationToken ct)
    {
        var clientIp = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var user = await _db.Users
            .Include(u => u.StudentProfile)
            .FirstOrDefaultAsync(u =>
                u.PasswordResetToken == request.Token &&
                u.PasswordResetTokenExpiresAt.HasValue &&
                u.PasswordResetTokenExpiresAt > DateTimeOffset.UtcNow,
                ct);

        if (user is null)
        {
            _auditLogger.LogInvalidActivationToken(request.Token, clientIp);
            return Result<AuthResponse>.NotFound(
                "El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.",
                "Enlace inválido o expirado");
        }

        // Hashear y actualizar contraseña
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.ResetPasswordWithToken(passwordHash);

        await _db.SaveChangesAsync(ct);
        _auditLogger.LogAccountActivated(user.Id, user.Email, clientIp);

        // Generar JWT para autologin inmediato
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
