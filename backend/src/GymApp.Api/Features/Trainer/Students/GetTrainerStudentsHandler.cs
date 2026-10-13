using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Students;

public interface IGetTrainerStudentsHandler
{
    Task<Result<List<StudentSummaryDto>>> HandleAsync(Guid trainerId, CancellationToken ct);
}

public class GetTrainerStudentsHandler : IGetTrainerStudentsHandler
{
    private readonly GymAppDbContext _db;

    public GetTrainerStudentsHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<List<StudentSummaryDto>>> HandleAsync(Guid trainerId, CancellationToken ct)
    {
        var students = await _db.Students
            .AsNoTracking()
            .Where(s => s.TrainerId == trainerId)
            .Select(TrainerStudentMappers.ProjectToSummary)
            .ToListAsync(ct);

        return Result<List<StudentSummaryDto>>.Success(students);
    }
}
