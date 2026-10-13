using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GymApp.Api.Database.Entities;
using Microsoft.IdentityModel.Tokens;

namespace GymApp.Api.Common.Auth;

public interface IJwtTokenService
{
    string GenerateToken(User user, Guid? studentId = null);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user, Guid? studentId = null)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? "GymApp_Super_Secret_Key_For_Development_Environment_2026_Minimum_32_Chars!";
        var issuer = _configuration["Jwt:Issuer"] ?? "GymAppApi";
        var audience = _configuration["Jwt:Audience"] ?? "GymAppClient";
        var expirationMinutes = int.TryParse(_configuration["Jwt:ExpirationMinutes"], out var exp) ? exp : 10080; // 7 días

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString().ToUpperInvariant()),
            new("fullName", user.FullName)
        };

        if (studentId.HasValue)
        {
            claims.Add(new Claim("studentId", studentId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
