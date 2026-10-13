using GymApp.Api.Database;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GymApp.Api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "GymAppTestDb_" + Guid.NewGuid();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Registrar DbContext en memoria aislado para el ambiente de pruebas
            services.AddDbContext<GymAppDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
            });

            // Inicializar y sembrar la base de datos de pruebas
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<GymAppDbContext>();
            db.Database.EnsureCreated();
            DatabaseSeeder.SeedAsync(db).GetAwaiter().GetResult();
        });
    }
}
