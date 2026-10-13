using GymApp.Api.Database.Entities;

namespace GymApp.Api.Features.Trainer.Students;

/// <summary>
/// Resumen administrativo del alumno a cargo del entrenador.
/// </summary>
/// <param name="Id">Identificador único del perfil del alumno.</param>
/// <param name="FullName">Nombre completo del alumno.</param>
/// <param name="Email">Correo electrónico registrado.</param>
/// <param name="PhoneWhatsapp">Teléfono de contacto para enlace con WhatsApp.</param>
/// <param name="SubscriptionStatus">Estado de la cuota: ACTIVE, EXPIRED, PENDING.</param>
/// <param name="SessionsRemaining">Cantidad de clases restantes disponibles.</param>
/// <param name="NextBillingDate">Fecha estimada del próximo vencimiento o cobro.</param>
/// <param name="AssignedRoutineTitle">Título de la rutina activa asignada actualmente, si existe.</param>
/// <param name="ActivationToken">Token de activación si el alumno aún no activó su cuenta.</param>
public record StudentSummaryDto(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneWhatsapp,
    string SubscriptionStatus,
    int SessionsRemaining,
    DateOnly? NextBillingDate,
    string? AssignedRoutineTitle = null,
    string? ActivationToken = null
);

/// <summary>
/// Respuesta tras regenerar el token de activación de un alumno.
/// </summary>
/// <param name="ActivationToken">Nuevo token generado.</param>
public record RegenerateActivationTokenResponse(string ActivationToken);

/// <summary>
/// Solicitud de alta de un nuevo alumno gestionado por el entrenador.
/// </summary>
/// <param name="FullName">Nombre completo del alumno.</param>
/// <param name="Email">Correo electrónico (debe ser único en el sistema).</param>
/// <param name="PhoneWhatsapp">Número telefónico de WhatsApp con prefijo internacional.</param>
/// <param name="MedicalNotes">Observaciones médicas, lesiones previas o contraindicaciones.</param>
/// <param name="FitnessGoals">Objetivos de entrenamiento (ej. hipertrofia, descenso de peso).</param>
/// <param name="SessionsRemaining">Pack inicial de sesiones contratadas.</param>
public record CreateStudentRequest(
    string FullName,
    string Email,
    string PhoneWhatsapp,
    string? MedicalNotes = null,
    string? FitnessGoals = null,
    int SessionsRemaining = 0
);

/// <summary>
/// Petición para actualizar la suscripción o paquete de clases de un alumno.
/// </summary>
/// <param name="SubscriptionStatus">Nuevo estado de la cuota: ACTIVE, EXPIRED o PENDING.</param>
/// <param name="SessionsRemainingDelta">Modificador aditivo de clases (ej. +12 o -1).</param>
/// <param name="NextBillingDate">Nueva fecha de vencimiento acordada.</param>
public record UpdateSubscriptionRequest(
    string SubscriptionStatus,
    int? SessionsRemainingDelta = null,
    DateOnly? NextBillingDate = null
);
