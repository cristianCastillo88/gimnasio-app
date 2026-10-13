namespace GymApp.Api.Features.Auth.ChangePassword;

/// <summary>
/// Solicitud de cambio de contraseña para un usuario con sesión activa.
/// </summary>
/// <param name="CurrentPassword">Contraseña actual del usuario para verificación.</param>
/// <param name="NewPassword">Nueva contraseña (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo).</param>
public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);
