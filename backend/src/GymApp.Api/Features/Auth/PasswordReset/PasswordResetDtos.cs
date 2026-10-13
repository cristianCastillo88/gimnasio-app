namespace GymApp.Api.Features.Auth.PasswordReset;

/// <summary>
/// Solicitud de recuperación de contraseña por correo electrónico.
/// </summary>
/// <param name="Email">Correo electrónico de la cuenta a recuperar.</param>
public record ForgotPasswordRequest(string Email);

/// <summary>
/// Respuesta informativa para la solicitud de olvido de contraseña.
/// </summary>
/// <param name="Message">Mensaje informativo anti-enumeración.</param>
public record ForgotPasswordResponse(string Message);

/// <summary>
/// Respuesta tras verificar la validez del token de restablecimiento.
/// </summary>
/// <param name="Email">Correo electrónico del usuario.</param>
/// <param name="FullName">Nombre completo del usuario para personalización.</param>
public record VerifyResetTokenResponse(string Email, string FullName);

/// <summary>
/// Solicitud para fijar nueva contraseña mediante token de restablecimiento.
/// </summary>
/// <param name="Token">Token de restablecimiento recibido por correo.</param>
/// <param name="NewPassword">Nueva contraseña (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo).</param>
public record ResetPasswordRequest(string Token, string NewPassword);
