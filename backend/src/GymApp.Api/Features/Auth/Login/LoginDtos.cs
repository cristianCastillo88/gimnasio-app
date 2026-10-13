namespace GymApp.Api.Features.Auth.Login;

/// <summary>
/// Solicitud de autenticación con credenciales del usuario.
/// </summary>
/// <param name="Email">Correo electrónico del usuario registrado.</param>
/// <param name="Password">Contraseña en texto plano a verificar mediante BCrypt.</param>
public record LoginRequest(string Email, string Password);

/// <summary>
/// Perfil del usuario autenticado.
/// </summary>
/// <param name="Id">Identificador único del usuario.</param>
/// <param name="Email">Correo electrónico.</param>
/// <param name="FullName">Nombre y apellido completo.</param>
/// <param name="Role">Rol asignado: TRAINER o STUDENT.</param>
/// <param name="PhoneWhatsapp">Número telefónico para contacto vía WhatsApp.</param>
/// <param name="StudentId">Identificador del perfil de alumno si el rol es STUDENT.</param>
public record UserProfileDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    string? PhoneWhatsapp,
    Guid? StudentId = null
);

/// <summary>
/// Respuesta exitosa de autenticación con token JWT Bearer.
/// </summary>
/// <param name="Token">Token de acceso JWT Bearer.</param>
/// <param name="User">Detalle del perfil autenticado.</param>
public record AuthResponse(string Token, UserProfileDto User);
