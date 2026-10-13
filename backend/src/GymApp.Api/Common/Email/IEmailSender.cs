namespace GymApp.Api.Common.Email;

public interface IEmailSender
{
    Task SendPasswordResetEmailAsync(string toEmail, string recipientName, string resetUrl, CancellationToken ct = default);
}

public class EmailSender : IEmailSender
{
    private readonly ILogger<EmailSender> _logger;
    private readonly IConfiguration _configuration;

    public EmailSender(ILogger<EmailSender> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string recipientName, string resetUrl, CancellationToken ct = default)
    {
        var smtpHost = _configuration["Email:SmtpHost"];
        if (string.IsNullOrWhiteSpace(smtpHost))
        {
            // Modo Desarrollo / Fallback: registrar en logs para pruebas locales sin servidor de correo
            _logger.LogInformation(
                "[EMAIL SENDER MOCK] Correo de restablecimiento de contraseña generado para {ToEmail} ({RecipientName}). Enlace: {ResetUrl}",
                toEmail, recipientName, resetUrl);
            await Task.CompletedTask;
            return;
        }

        try
        {
            var smtpPort = _configuration.GetValue<int>("Email:SmtpPort", 587);
            var username = _configuration["Email:Username"];
            var password = _configuration["Email:Password"];
            var fromEmail = _configuration["Email:FromEmail"] ?? "no-reply@gymapp.com";
            var fromName = _configuration["Email:FromName"] ?? "GymApp";

            using var client = new System.Net.Mail.SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = _configuration.GetValue<bool>("Email:EnableSsl", true),
                Credentials = !string.IsNullOrWhiteSpace(username)
                    ? new System.Net.NetworkCredential(username, password)
                    : null
            };

            var mail = new System.Net.Mail.MailMessage
            {
                From = new System.Net.Mail.MailAddress(fromEmail, fromName),
                Subject = "Recuperación de Contraseña - GymApp",
                IsBodyHtml = true,
                Body = $@"
<div style='font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #121214; color: #ffffff; border-radius: 12px; border: 1px solid #27272a;'>
    <div style='display: flex; align-items: center; gap: 8px; margin-bottom: 16px;'>
        <span style='font-size: 24px;'>⚡</span>
        <h2 style='color: #c4f12a; margin: 0;'>GymApp</h2>
    </div>
    <p style='color: #e4e4e7;'>Hola <strong>{System.Net.WebUtility.HtmlEncode(recipientName)}</strong>,</p>
    <p style='color: #a1a1aa; line-height: 1.5;'>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de entrenador. Haz clic en el botón a continuación para crear una nueva clave:</p>
    <div style='margin: 28px 0; text-align: center;'>
        <a href='{resetUrl}' style='background: #c4f12a; color: #09090b; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 2px 8px rgba(196, 241, 42, 0.25);'>Restablecer mi Contraseña</a>
    </div>
    <p style='font-size: 0.8125rem; color: #71717a; border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px;'>Este enlace es de uso único y expirará en 1 hora. Si tú no solicitaste este cambio, puedes ignorar este mensaje de forma segura.</p>
</div>"
            };
            mail.To.Add(new System.Net.Mail.MailAddress(toEmail, recipientName));

            await client.SendMailAsync(mail, ct);
            _logger.LogInformation("[EMAIL SENDER] Correo de restablecimiento enviado exitosamente a {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[EMAIL SENDER ERROR] Error al enviar correo de recuperación a {ToEmail}", toEmail);
        }
    }
}
