using GymApp.Api.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Database;

public class GymAppDbContext : DbContext
{
    public GymAppDbContext(DbContextOptions<GymAppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<RoutineTemplate> RoutineTemplates => Set<RoutineTemplate>();
    public DbSet<RoutineDay> RoutineDays => Set<RoutineDay>();
    public DbSet<RoutineExercise> RoutineExercises => Set<RoutineExercise>();
    public DbSet<RoutineAssignment> RoutineAssignments => Set<RoutineAssignment>();
    public DbSet<WorkoutSession> WorkoutSessions => Set<WorkoutSession>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GymAppDbContext).Assembly);
    }
}
