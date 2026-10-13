using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymApp.Api.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PhoneWhatsapp = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "exercises",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrainerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    MuscleGroup = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    MovementPattern = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    VideoUrl = table.Column<string>(type: "text", nullable: true),
                    ExecutionTips = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_exercises_users_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "routine_templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TrainerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_routine_templates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_routine_templates_users_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "students",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TrainerId = table.Column<Guid>(type: "uuid", nullable: false),
                    MedicalNotes = table.Column<string>(type: "text", nullable: true),
                    FitnessGoals = table.Column<string>(type: "text", nullable: true),
                    SubscriptionStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SessionsRemaining = table.Column<int>(type: "integer", nullable: false),
                    NextBillingDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_students", x => x.Id);
                    table.ForeignKey(
                        name: "FK_students_users_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_students_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "routine_days",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_routine_days", x => x.Id);
                    table.ForeignKey(
                        name: "FK_routine_days_routine_templates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "routine_templates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "routine_assignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoutineTemplateId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_routine_assignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_routine_assignments_routine_templates_RoutineTemplateId",
                        column: x => x.RoutineTemplateId,
                        principalTable: "routine_templates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_routine_assignments_students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "routine_exercises",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoutineDayId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExerciseId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    TargetSets = table.Column<int>(type: "integer", nullable: false),
                    TargetReps = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    SuggestedWeightKg = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: true),
                    SuggestedRestSeconds = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_routine_exercises", x => x.Id);
                    table.ForeignKey(
                        name: "FK_routine_exercises_exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "exercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_routine_exercises_routine_days_RoutineDayId",
                        column: x => x.RoutineDayId,
                        principalTable: "routine_days",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "workout_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IdempotencyKey = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoutineDayId = table.Column<Guid>(type: "uuid", nullable: true),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RpeScore = table.Column<int>(type: "integer", nullable: false),
                    StudentNotes = table.Column<string>(type: "text", nullable: true),
                    IsSynced = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_workout_sessions_routine_days_RoutineDayId",
                        column: x => x.RoutineDayId,
                        principalTable: "routine_days",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_workout_sessions_students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "workout_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExerciseId = table.Column<Guid>(type: "uuid", nullable: false),
                    SetNumber = table.Column<int>(type: "integer", nullable: false),
                    ActualReps = table.Column<int>(type: "integer", nullable: false),
                    ActualWeightKg = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_workout_logs_exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "exercises",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_workout_logs_workout_sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "workout_sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_exercises_TrainerId_Name",
                table: "exercises",
                columns: new[] { "TrainerId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_routine_assignments_RoutineTemplateId",
                table: "routine_assignments",
                column: "RoutineTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_routine_assignments_StudentId_IsActive",
                table: "routine_assignments",
                columns: new[] { "StudentId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_routine_days_TemplateId_OrderIndex",
                table: "routine_days",
                columns: new[] { "TemplateId", "OrderIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_routine_exercises_ExerciseId",
                table: "routine_exercises",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_routine_exercises_RoutineDayId_OrderIndex",
                table: "routine_exercises",
                columns: new[] { "RoutineDayId", "OrderIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_routine_templates_TrainerId",
                table: "routine_templates",
                column: "TrainerId");

            migrationBuilder.CreateIndex(
                name: "IX_students_TrainerId",
                table: "students",
                column: "TrainerId");

            migrationBuilder.CreateIndex(
                name: "IX_students_UserId",
                table: "students",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_workout_logs_ExerciseId_SessionId",
                table: "workout_logs",
                columns: new[] { "ExerciseId", "SessionId" });

            migrationBuilder.CreateIndex(
                name: "IX_workout_logs_SessionId",
                table: "workout_logs",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_workout_sessions_IdempotencyKey",
                table: "workout_sessions",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_workout_sessions_RoutineDayId",
                table: "workout_sessions",
                column: "RoutineDayId");

            migrationBuilder.CreateIndex(
                name: "IX_workout_sessions_StudentId_CompletedAt",
                table: "workout_sessions",
                columns: new[] { "StudentId", "CompletedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "routine_assignments");

            migrationBuilder.DropTable(
                name: "routine_exercises");

            migrationBuilder.DropTable(
                name: "workout_logs");

            migrationBuilder.DropTable(
                name: "exercises");

            migrationBuilder.DropTable(
                name: "workout_sessions");

            migrationBuilder.DropTable(
                name: "routine_days");

            migrationBuilder.DropTable(
                name: "students");

            migrationBuilder.DropTable(
                name: "routine_templates");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
