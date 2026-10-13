using GymApp.Api.Common;
using GymApp.Api.Database;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Features.Trainer.Routines;

public interface IGetTrainerRoutinesHandler
{
    Task<Result<List<RoutineTemplateSummaryDto>>> HandleAsync(Guid trainerId, CancellationToken ct);
}

public class GetTrainerRoutinesHandler : IGetTrainerRoutinesHandler
{
    private readonly GymAppDbContext _db;

    public GetTrainerRoutinesHandler(GymAppDbContext db)
    {
        _db = db;
    }

    public async Task<Result<List<RoutineTemplateSummaryDto>>> HandleAsync(Guid trainerId, CancellationToken ct)
    {
        var templates = await _db.RoutineTemplates
            .AsNoTracking()
            .Where(t => t.TrainerId == trainerId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new RoutineTemplateSummaryDto(
                t.Id,
                t.Title,
                t.Description,
                t.Days.Count,
                t.Days.SelectMany(d => d.RoutineExercises).Count(),
                t.Assignments.Count(a => a.IsActive),
                t.CreatedAt
            ))
            .ToListAsync(ct);

        return Result<List<RoutineTemplateSummaryDto>>.Success(templates);
    }
}
