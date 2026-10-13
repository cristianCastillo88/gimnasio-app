using GymApp.Api.Common;
using GymApp.Api.Database;
using GymApp.Api.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Students;

public interface ICreateStudentHandler
{
    Task<Result<StudentSummaryDto>> HandleAsync(
        CreateStudentRequest request,
        Guid trainerId,
        CancellationToken ct);
}

public class CreateStudentHandler : ICreateStudentHandler
{
    private readonly GymAppDbContext _db;

    public CreateStudentHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<StudentSummaryDto>> HandleAsync(
        CreateStudentRequest request,
        Guid trainerId,
        CancellationToken ct)
    {
        // 1. Verificar si el email ya existe
        var emailExists = await _db.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower(), ct);
        if (emailExists)
        {
            return Result<StudentSummaryDto>.Conflict(
                "Ya existe un usuario registrado con este correo electrónico.",
                "Email duplicado"
            );
        }

        // 2. Crear usuario de dominio pendiente de activación con token CSPRNG de 256 bits
        var studentUser = User.CreatePendingStudent(request.Email, request.FullName, request.PhoneWhatsapp);
        _db.Users.Add(studentUser);

        // 3. Crear perfil de alumno de dominio
        var studentProfile = Student.Create(
            studentUser.Id,
            trainerId,
            request.MedicalNotes,
            request.FitnessGoals,
            request.SessionsRemaining
        );
        _db.Students.Add(studentProfile);

        await _db.SaveChangesAsync(ct);

        studentProfile.User = studentUser;
        return Result<StudentSummaryDto>.Success(studentProfile.ToSummaryDto());
    }
}
