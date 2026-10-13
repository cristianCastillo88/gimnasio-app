using GymApp.Api.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymApp.Api.Database;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(GymAppDbContext db)
    {
        // Evitar sembrar si ya existen usuarios
        if (await db.Users.AnyAsync())
        {
            return;
        }

        // 1. Crear Trainer
        var trainerUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "trainer@gymapp.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Trainer123!"),
            Role = UserRole.Trainer,
            FullName = "Carlos Trainer",
            PhoneWhatsapp = "+5491112345678",
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.Users.Add(trainerUser);

        // 2. Crear Alumno
        var studentUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "alumno@gymapp.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Alumno123!"),
            Role = UserRole.Student,
            FullName = "Lucas Alumno",
            PhoneWhatsapp = "+5491187654321",
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.Users.Add(studentUser);

        var studentProfile = new Student
        {
            Id = Guid.NewGuid(),
            UserId = studentUser.Id,
            TrainerId = trainerUser.Id,
            MedicalNotes = "Sin lesiones previas. Apto médico al día.",
            FitnessGoals = "Ganancia de masa muscular y fuerza en básicos.",
            SubscriptionStatus = SubscriptionStatus.Active,
            SessionsRemaining = 8,
            NextBillingDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(25)),
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.Students.Add(studentProfile);

        // 3. Crear Ejercicios
        var exBench = new Exercise
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerUser.Id,
            Name = "Press de Banca Plano con Barra",
            MuscleGroup = "Pectoral",
            MovementPattern = "Empuje horizontal",
            VideoUrl = "https://www.youtube.com/shorts/rT7DgCr-3pg",
            ExecutionTips = "Retraer y deprimir escápulas. Bajar la barra controlada al esternón con los codos a 45 grados.",
            CreatedAt = DateTimeOffset.UtcNow
        };

        var exPullup = new Exercise
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerUser.Id,
            Name = "Dominadas Pronas",
            MuscleGroup = "Espalda",
            MovementPattern = "Tracción vertical",
            VideoUrl = "https://www.youtube.com/shorts/eGo4IYlbE5g",
            ExecutionTips = "Rango completo de movimiento. Pecho hacia la barra sin balanceo de cadera.",
            CreatedAt = DateTimeOffset.UtcNow
        };

        var exMilitary = new Exercise
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerUser.Id,
            Name = "Press Militar con Mancuernas",
            MuscleGroup = "Hombros",
            MovementPattern = "Empuje vertical",
            VideoUrl = "https://www.youtube.com/shorts/qEwKCR5JCog",
            ExecutionTips = "Espalda apoyada firmemente, activar abdomen para no arquear la zona lumbar.",
            CreatedAt = DateTimeOffset.UtcNow
        };

        var exSquat = new Exercise
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerUser.Id,
            Name = "Sentadilla con Barra Trasera",
            MuscleGroup = "Cuádriceps",
            MovementPattern = "Dominante de rodilla",
            VideoUrl = "https://www.youtube.com/shorts/bEv6CCg2BC8",
            ExecutionTips = "Pies al ancho de hombros, romper el paralelo manteniendo el torso firme y rodillas alineadas.",
            CreatedAt = DateTimeOffset.UtcNow
        };

        var exRdl = new Exercise
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerUser.Id,
            Name = "Peso Muerto Rumano",
            MuscleGroup = "Isquios y Glúteos",
            MovementPattern = "Bisagra de cadera",
            VideoUrl = "https://www.youtube.com/shorts/2K3OUzV9wGQ",
            ExecutionTips = "Empujar la cadera hacia atrás sintiendo la tensión en isquiotibiales. Barra pegada a las espinillas.",
            CreatedAt = DateTimeOffset.UtcNow
        };

        var exLaterals = new Exercise
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerUser.Id,
            Name = "Elevaciones Laterales con Mancuernas",
            MuscleGroup = "Deltoides Lateral",
            MovementPattern = "Aislamiento",
            VideoUrl = "https://www.youtube.com/shorts/3VcKaXpzqRo",
            ExecutionTips = "Ligera inclinación hacia adelante. Levantar con los codos sin encoger hombros.",
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Exercises.AddRange(exBench, exPullup, exMilitary, exSquat, exRdl, exLaterals);

        // 4. Crear Plantilla de Rutina y Días A / B
        var routineTemplate = new RoutineTemplate
        {
            Id = Guid.NewGuid(),
            TrainerId = trainerUser.Id,
            Title = "Fuerza e Hipertrofia 2 Días",
            Description = "Programa de torso/pierna para 2 a 3 sesiones semanales flexibles.",
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.RoutineTemplates.Add(routineTemplate);

        var dayA = new RoutineDay
        {
            Id = Guid.NewGuid(),
            TemplateId = routineTemplate.Id,
            Name = "Día A: Torso Fuerza",
            OrderIndex = 1
        };

        var dayB = new RoutineDay
        {
            Id = Guid.NewGuid(),
            TemplateId = routineTemplate.Id,
            Name = "Día B: Pierna y Cadena Posterior",
            OrderIndex = 2
        };
        db.RoutineDays.AddRange(dayA, dayB);

        // Ejercicios Día A
        db.RoutineExercises.AddRange(
            new RoutineExercise
            {
                Id = Guid.NewGuid(),
                RoutineDayId = dayA.Id,
                ExerciseId = exBench.Id,
                OrderIndex = 1,
                TargetSets = 4,
                TargetReps = "6-8",
                SuggestedWeightKg = 70.0m,
                SuggestedRestSeconds = 120,
                Notes = "Calentar bien antes de series efectivas."
            },
            new RoutineExercise
            {
                Id = Guid.NewGuid(),
                RoutineDayId = dayA.Id,
                ExerciseId = exPullup.Id,
                OrderIndex = 2,
                TargetSets = 4,
                TargetReps = "8-10",
                SuggestedWeightKg = null,
                SuggestedRestSeconds = 90
            },
            new RoutineExercise
            {
                Id = Guid.NewGuid(),
                RoutineDayId = dayA.Id,
                ExerciseId = exMilitary.Id,
                OrderIndex = 3,
                TargetSets = 3,
                TargetReps = "8-10",
                SuggestedWeightKg = 20.0m,
                SuggestedRestSeconds = 90
            }
        );

        // Ejercicios Día B
        db.RoutineExercises.AddRange(
            new RoutineExercise
            {
                Id = Guid.NewGuid(),
                RoutineDayId = dayB.Id,
                ExerciseId = exSquat.Id,
                OrderIndex = 1,
                TargetSets = 4,
                TargetReps = "6-8",
                SuggestedWeightKg = 90.0m,
                SuggestedRestSeconds = 150
            },
            new RoutineExercise
            {
                Id = Guid.NewGuid(),
                RoutineDayId = dayB.Id,
                ExerciseId = exRdl.Id,
                OrderIndex = 2,
                TargetSets = 3,
                TargetReps = "8-10",
                SuggestedWeightKg = 70.0m,
                SuggestedRestSeconds = 120
            },
            new RoutineExercise
            {
                Id = Guid.NewGuid(),
                RoutineDayId = dayB.Id,
                ExerciseId = exLaterals.Id,
                OrderIndex = 3,
                TargetSets = 3,
                TargetReps = "12-15",
                SuggestedWeightKg = 10.0m,
                SuggestedRestSeconds = 60
            }
        );

        // 5. Asignar rutina al alumno
        var assignment = new RoutineAssignment
        {
            Id = Guid.NewGuid(),
            StudentId = studentProfile.Id,
            RoutineTemplateId = routineTemplate.Id,
            AssignedAt = DateTimeOffset.UtcNow,
            IsActive = true
        };
        db.RoutineAssignments.Add(assignment);

        // 6. Crear un entrenamiento pasado para alimentar el Historial Inline
        var pastSession = new WorkoutSession
        {
            Id = Guid.NewGuid(),
            IdempotencyKey = Guid.NewGuid(),
            StudentId = studentProfile.Id,
            RoutineDayId = dayA.Id,
            StartedAt = DateTimeOffset.UtcNow.AddDays(-3).AddHours(-1),
            CompletedAt = DateTimeOffset.UtcNow.AddDays(-3),
            RpeScore = 8,
            StudentNotes = "Buenas sensaciones en pecho. Subir 2.5kg la próxima.",
            IsSynced = true,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-3)
        };
        db.WorkoutSessions.Add(pastSession);

        db.WorkoutLogs.AddRange(
            new WorkoutLog { Id = Guid.NewGuid(), SessionId = pastSession.Id, ExerciseId = exBench.Id, SetNumber = 1, ActualReps = 8, ActualWeightKg = 70.0m, IsCompleted = true, CompletedAt = pastSession.StartedAt.AddMinutes(15) },
            new WorkoutLog { Id = Guid.NewGuid(), SessionId = pastSession.Id, ExerciseId = exBench.Id, SetNumber = 2, ActualReps = 8, ActualWeightKg = 70.0m, IsCompleted = true, CompletedAt = pastSession.StartedAt.AddMinutes(20) },
            new WorkoutLog { Id = Guid.NewGuid(), SessionId = pastSession.Id, ExerciseId = exBench.Id, SetNumber = 3, ActualReps = 7, ActualWeightKg = 70.0m, IsCompleted = true, CompletedAt = pastSession.StartedAt.AddMinutes(25) },
            new WorkoutLog { Id = Guid.NewGuid(), SessionId = pastSession.Id, ExerciseId = exBench.Id, SetNumber = 4, ActualReps = 6, ActualWeightKg = 70.0m, IsCompleted = true, CompletedAt = pastSession.StartedAt.AddMinutes(30) },

            new WorkoutLog { Id = Guid.NewGuid(), SessionId = pastSession.Id, ExerciseId = exPullup.Id, SetNumber = 1, ActualReps = 10, ActualWeightKg = 0m, IsCompleted = true, CompletedAt = pastSession.StartedAt.AddMinutes(35) },
            new WorkoutLog { Id = Guid.NewGuid(), SessionId = pastSession.Id, ExerciseId = exPullup.Id, SetNumber = 2, ActualReps = 9, ActualWeightKg = 0m, IsCompleted = true, CompletedAt = pastSession.StartedAt.AddMinutes(40) }
        );

        await db.SaveChangesAsync();
    }
}
