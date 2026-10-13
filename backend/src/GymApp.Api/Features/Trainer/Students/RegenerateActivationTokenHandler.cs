using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Students;

public interface IRegenerateActivationTokenHandler
{
    Task<Result<RegenerateActivationTokenResponse>> HandleAsync(
        Guid studentId,
        Guid trainerId,
        CancellationToken ct);
}

public class RegenerateActivationTokenHandler : IRegenerateActivationTokenHandler
{
    private readonly GymAppDbContext _db;

    public RegenerateActivationTokenHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<RegenerateActivationTokenResponse>> HandleAsync(
        Guid studentId,
        Guid trainerId,
        CancellationToken ct)
    {
        var student = await _db.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == studentId && s.TrainerId == trainerId, ct);

        if (student is null)
        {
            return Result<RegenerateActivationTokenResponse>.NotFound(
                "Alumno no encontrado bajo el control del entrenador.",
                "Alumno no encontrado");
        }

        var newToken = student.User.RegenerateActivationToken();
        await _db.SaveChangesAsync(ct);

        return Result<RegenerateActivationTokenResponse>.Success(
            new RegenerateActivationTokenResponse(newToken)
        );
    }
}
