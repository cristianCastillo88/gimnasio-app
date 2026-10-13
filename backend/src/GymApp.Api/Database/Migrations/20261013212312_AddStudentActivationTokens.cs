using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymApp.Api.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentActivationTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActivationToken",
                table: "users",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ActivationTokenExpiresAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_ActivationToken",
                table: "users",
                column: "ActivationToken");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_ActivationToken",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ActivationToken",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ActivationTokenExpiresAt",
                table: "users");
        }
    }
}
