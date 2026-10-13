using System.Diagnostics;

namespace GymApp.Api.Common.Security;

public interface ISecurityAuditLogger
{
    void LogFailedLogin(string email, string ipAddress, string reason);
    void LogSuccessfulLogin(Guid userId, string role, string ipAddress);
    void LogInvalidActivationToken(string token, string ipAddress);
    void LogAccountActivated(Guid userId, string email, string ipAddress);
    void LogAccessDenied(Guid userId, string attemptedResource, string ipAddress);
}

public class SecurityAuditLogger : ISecurityAuditLogger
{
    private readonly ILogger<SecurityAuditLogger> _logger;

    public SecurityAuditLogger(ILogger<SecurityAuditLogger> logger)
    {
        _logger = logger;
    }

    public void LogFailedLogin(string email, string ipAddress, string reason)
    {
        var maskedEmail = MaskEmail(email);
        var traceId = Activity.Current?.Id ?? "no-trace";
        _logger.LogWarning(
            "[SECURITY AUDIT] Intento fallido de inicio de sesión. Email: {MaskedEmail}, IP: {IpAddress}, Razón: {Reason}, TraceId: {TraceId}",
            maskedEmail, ipAddress, reason, traceId);
    }

    public void LogSuccessfulLogin(Guid userId, string role, string ipAddress)
    {
        var traceId = Activity.Current?.Id ?? "no-trace";
        _logger.LogInformation(
            "[SECURITY AUDIT] Inicio de sesión exitoso. UserId: {UserId}, Rol: {Role}, IP: {IpAddress}, TraceId: {TraceId}",
            userId, role, ipAddress, traceId);
    }

    public void LogInvalidActivationToken(string token, string ipAddress)
    {
        var maskedToken = token.Length > 8 ? $"{token[..6]}..." : "invalid";
        var traceId = Activity.Current?.Id ?? "no-trace";
        _logger.LogWarning(
            "[SECURITY AUDIT] Intento de activación con token inválido o expirado. Token: {MaskedToken}, IP: {IpAddress}, TraceId: {TraceId}",
            maskedToken, ipAddress, traceId);
    }

    public void LogAccountActivated(Guid userId, string email, string ipAddress)
    {
        var maskedEmail = MaskEmail(email);
        var traceId = Activity.Current?.Id ?? "no-trace";
        _logger.LogInformation(
            "[SECURITY AUDIT] Cuenta activada con éxito. UserId: {UserId}, Email: {MaskedEmail}, IP: {IpAddress}, TraceId: {TraceId}",
            userId, maskedEmail, ipAddress, traceId);
    }

    public void LogAccessDenied(Guid userId, string attemptedResource, string ipAddress)
    {
        var traceId = Activity.Current?.Id ?? "no-trace";
        _logger.LogWarning(
            "[SECURITY AUDIT] Acceso denegado / Violación de pertenencia. UserId: {UserId}, Recurso: {Resource}, IP: {IpAddress}, TraceId: {TraceId}",
            userId, attemptedResource, ipAddress, traceId);
    }

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return "***";
        }

        var parts = email.Split('@');
        var name = parts[0];
        var domain = parts[1];

        var maskedName = name.Length switch
        {
            <= 2 => $"{name[0]}*",
            _ => $"{name[0]}***{name[^1]}"
        };

        return $"{maskedName}@{domain}";
    }
}
