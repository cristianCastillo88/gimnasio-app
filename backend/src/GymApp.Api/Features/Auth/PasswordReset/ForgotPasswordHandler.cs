using GymApp.Api.Common;
using GymApp.Api.Common.Email;
using GymApp.Api.Common.Security;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Auth.PasswordReset;

public interface IForgotPasswordHandler
{
    Task<Result<ForgotPasswordResponse>> HandleAsync(ForgotPasswordRequest request, CancellationToken ct);
}

public class ForgotPasswordHandler : IForgotPasswordHandler
{
    private readonly GymAppDbContext _db;
    private readonly IEmailSender _emailSender;
    private readonly ISecurityAuditLogger _auditLogger;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;

    public ForgotPasswordHandler(
        GymAppDbContext db,
        IEmailSender emailSender,
        ISecurityAuditLogger auditLogger,
        IHttpContextAccessor httpContextAccessor,
        IConfiguration configuration)
    {
        _db = db;
        _emailSender = emailSender;
        _auditLogger = auditLogger;
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
    }

    public async Task<Result<ForgotPasswordResponse>> HandleAsync(ForgotPasswordRequest request, CancellationToken ct)
    {
        var clientIp = _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var neutralMessage = "Si el correo electrónico está registrado en GymApp, se han enviado las instrucciones para restablecer la contraseña.";

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, ct);
        if (user is null)
        {
            _auditLogger.LogFailedLogin(request.Email, clientIp, "Solicitud de recuperación para correo no registrado");
            return Result<ForgotPasswordResponse>.Success(new ForgotPasswordResponse(neutralMessage));
        }

        // Generar token criptoseguro de 256 bits válido por 1 hora
        var token = user.GeneratePasswordResetToken(validHours: 1);
        await _db.SaveChangesAsync(ct);

        // Construir URL de restablecimiento para el frontend
        var clientBaseUrl = _configuration["App:ClientBaseUrl"];
        if (string.IsNullOrWhiteSpace(clientBaseUrl))
        {
            var requestOrigin = _httpContextAccessor.HttpContext?.Request.Headers["Origin"].FirstOrDefault();
            clientBaseUrl = !string.IsNullOrWhiteSpace(requestOrigin) ? requestOrigin : "http://localhost:5173";
        }

        var resetUrl = $"{clientBaseUrl.TrimEnd('/')}/?resetToken={Uri.EscapeDataString(token)}";

        // Despachar correo electrónico
        await _emailSender.SendPasswordResetEmailAsync(user.Email, user.FullName, resetUrl, ct);

        return Result<ForgotPasswordResponse>.Success(new ForgotPasswordResponse(neutralMessage));
    }
}
