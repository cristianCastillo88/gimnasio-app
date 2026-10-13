namespace GymApp.Api.Features.Auth.Activation;

/// <summary>
/// Respuesta tras verificar la validez de un token de activación.
/// </summary>
/// <param name="FullName">Nombre completo del alumno para personalizar la bienvenida.</param>
/// <param name="Email">Correo electrónico del alumno.</param>
public record VerifyActivationTokenResponse(string FullName, string Email);

/// <summary>
/// Solicitud del alumno para activar su cuenta y fijar su contraseña personal.
/// </summary>
/// <param name="Token">Token criptoseguro recibido en el enlace de invitación.</param>
/// <param name="NewPassword">Contraseña personal elegida por el alumno (mínimo 6 caracteres).</param>
public record ActivateAccountRequest(string Token, string NewPassword);
