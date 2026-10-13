using GymApp.Api.Common;
using GymApp.Api.Common.Auth;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Auth.Login;

public interface ILoginHandler
{
    Task<Result<AuthResponse>> HandleAsync(LoginRequest request, CancellationToken ct);
}

public class LoginHandler : ILoginHandler
{
    private readonly GymAppDbContext _db;
    private readonly IJwtTokenService _jwtService;
    private readonly GymApp.Api.Common.Security.ISecurityAuditLogger _auditLogger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public LoginHandler(
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

    public async Task<Result<AuthResponse>> HandleAsync(LoginRequest request, CancellationToken ct)
    {
        var clientIp = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var user = await _db.Users
            .Include(u => u.StudentProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            _auditLogger.LogFailedLogin(request.Email, clientIp, user is null ? "Usuario no encontrado" : "Contraseña incorrecta");
            return Result<AuthResponse>.Unauthorized(
                "El email o la contraseña ingresados son incorrectos.",
                "Credenciales inválidas"
            );
        }

        _auditLogger.LogSuccessfulLogin(user.Id, user.Role.ToString(), clientIp);

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
