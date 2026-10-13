using GymApp.Api.Database.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymApp.Api.Database.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);
        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .HasMaxLength(255);

        builder.Property(u => u.FullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(u => u.PhoneWhatsapp)
            .HasMaxLength(30);

        builder.Property(u => u.ActivationToken)
            .HasMaxLength(64);
        builder.HasIndex(u => u.ActivationToken);

        builder.Property(u => u.PasswordResetToken)
            .HasMaxLength(64);
        builder.HasIndex(u => u.PasswordResetToken);

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .HasMaxLength(20);
    }
}

public class StudentConfiguration : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.ToTable("students");
        builder.HasKey(s => s.Id);

        builder.HasOne(s => s.User)
            .WithOne(u => u.StudentProfile)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Trainer)
            .WithMany(u => u.TrainerStudents)
            .HasForeignKey(s => s.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(s => s.SubscriptionStatus)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(s => s.TrainerId);
    }
}

public class ExerciseConfiguration : IEntityTypeConfiguration<Exercise>
{
    public void Configure(EntityTypeBuilder<Exercise> builder)
    {
        builder.ToTable("exercises");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(120);

        builder.Property(e => e.MuscleGroup)
            .IsRequired()
            .HasMaxLength(60);

        builder.Property(e => e.MovementPattern)
            .HasMaxLength(60);

        builder.HasOne(e => e.Trainer)
            .WithMany(u => u.Exercises)
            .HasForeignKey(e => e.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.TrainerId, e.Name });
    }
}

public class RoutineConfigurations :
    IEntityTypeConfiguration<RoutineTemplate>,
    IEntityTypeConfiguration<RoutineDay>,
    IEntityTypeConfiguration<RoutineExercise>,
    IEntityTypeConfiguration<RoutineAssignment>
{
    public void Configure(EntityTypeBuilder<RoutineTemplate> builder)
    {
        builder.ToTable("routine_templates");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Title)
            .IsRequired()
            .HasMaxLength(120);

        builder.HasOne(r => r.Trainer)
            .WithMany(u => u.RoutineTemplates)
            .HasForeignKey(r => r.TrainerId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public void Configure(EntityTypeBuilder<RoutineDay> builder)
    {
        builder.ToTable("routine_days");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Name)
            .IsRequired()
            .HasMaxLength(80);

        builder.HasOne(d => d.Template)
            .WithMany(t => t.Days)
            .HasForeignKey(d => d.TemplateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => new { d.TemplateId, d.OrderIndex });
    }

    public void Configure(EntityTypeBuilder<RoutineExercise> builder)
    {
        builder.ToTable("routine_exercises");
        builder.HasKey(re => re.Id);

        builder.Property(re => re.TargetReps)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(re => re.SuggestedWeightKg)
            .HasPrecision(6, 2);

        builder.HasOne(re => re.RoutineDay)
            .WithMany(d => d.RoutineExercises)
            .HasForeignKey(re => re.RoutineDayId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(re => re.Exercise)
            .WithMany(e => e.RoutineExercises)
            .HasForeignKey(re => re.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(re => new { re.RoutineDayId, re.OrderIndex });
    }

    public void Configure(EntityTypeBuilder<RoutineAssignment> builder)
    {
        builder.ToTable("routine_assignments");
        builder.HasKey(ra => ra.Id);

        builder.HasOne(ra => ra.Student)
            .WithMany(s => s.RoutineAssignments)
            .HasForeignKey(ra => ra.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ra => ra.RoutineTemplate)
            .WithMany(t => t.Assignments)
            .HasForeignKey(ra => ra.RoutineTemplateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ra => new { ra.StudentId, ra.IsActive });
    }
}

public class WorkoutConfigurations :
    IEntityTypeConfiguration<WorkoutSession>,
    IEntityTypeConfiguration<WorkoutLog>
{
    public void Configure(EntityTypeBuilder<WorkoutSession> builder)
    {
        builder.ToTable("workout_sessions");
        builder.HasKey(ws => ws.Id);

        // Clave de Idempotencia estricta para offline sync
        builder.Property(ws => ws.IdempotencyKey)
            .IsRequired();
        builder.HasIndex(ws => ws.IdempotencyKey)
            .IsUnique();

        builder.HasOne(ws => ws.Student)
            .WithMany(s => s.WorkoutSessions)
            .HasForeignKey(ws => ws.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ws => ws.RoutineDay)
            .WithMany(rd => rd.WorkoutSessions)
            .HasForeignKey(ws => ws.RoutineDayId)
            .OnDelete(DeleteBehavior.SetNull);

        // Índice para consultas de historial y actividad
        builder.HasIndex(ws => new { ws.StudentId, ws.CompletedAt });
    }

    public void Configure(EntityTypeBuilder<WorkoutLog> builder)
    {
        builder.ToTable("workout_logs");
        builder.HasKey(wl => wl.Id);

        builder.Property(wl => wl.ActualWeightKg)
            .HasPrecision(6, 2);

        builder.HasOne(wl => wl.Session)
            .WithMany(ws => ws.Logs)
            .HasForeignKey(wl => wl.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(wl => wl.Exercise)
            .WithMany(e => e.WorkoutLogs)
            .HasForeignKey(wl => wl.ExerciseId)
            .OnDelete(DeleteBehavior.Restrict);

        // Índice de alta velocidad para el Historial Inline
        builder.HasIndex(wl => new { wl.ExerciseId, wl.SessionId });
    }
}
