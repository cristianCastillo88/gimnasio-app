using System.Linq.Expressions;
using GymApp.Api.Database.Entities;

namespace GymApp.Api.Features.Trainer.Students;

public static class TrainerStudentMappers
{
    /// <summary>
    /// Expresión reusable para proyectar consultas de EF Core a nivel de base de datos SQL.
    /// Trae únicamente las columnas requeridas sin sobrecargar memoria.
    /// </summary>
    public static readonly Expression<Func<Student, StudentSummaryDto>> ProjectToSummary = s =>
        new StudentSummaryDto(
            s.Id,
            s.User.FullName,
            s.User.Email,
            s.User.PhoneWhatsapp,
            s.SubscriptionStatus.ToString().ToUpper(),
            s.SessionsRemaining,
            s.NextBillingDate,
            s.RoutineAssignments.Where(ra => ra.IsActive).Select(ra => ra.RoutineTemplate.Title).FirstOrDefault(),
            s.User.ActivationToken
        );

    /// <summary>
    /// Método de extensión para mapear una entidad Student cargada en memoria a su DTO resumen.
    /// </summary>
    public static StudentSummaryDto ToSummaryDto(this Student student, string? assignedRoutineTitle = null)
    {
        return new StudentSummaryDto(
            student.Id,
            student.User.FullName,
            student.User.Email,
            student.User.PhoneWhatsapp,
            student.SubscriptionStatus.ToString().ToUpperInvariant(),
            student.SessionsRemaining,
            student.NextBillingDate,
            assignedRoutineTitle,
            student.User?.ActivationToken
        );
    }
}
