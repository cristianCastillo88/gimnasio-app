namespace GymApp.Api.Database.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Student;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneWhatsapp { get; set; }
    public string? ActivationToken { get; set; }
    public DateTimeOffset? ActivationTokenExpiresAt { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTimeOffset? PasswordResetTokenExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Relaciones
    public Student? StudentProfile { get; set; }
    public ICollection<Student> TrainerStudents { get; set; } = new List<Student>();
    public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
    public ICollection<RoutineTemplate> RoutineTemplates { get; set; } = new List<RoutineTemplate>();

    // Comportamiento de Dominio
    public static string GenerateSecureToken()
    {
        return Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
    }

    public static User CreateStudent(string email, string passwordHash, string fullName, string? phoneWhatsapp)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email, nameof(email));
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName, nameof(fullName));

        return new User
        {
            Id = Guid.NewGuid(),
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            Role = UserRole.Student,
            FullName = fullName.Trim(),
            PhoneWhatsapp = phoneWhatsapp?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public static User CreatePendingStudent(string email, string fullName, string? phoneWhatsapp, string? activationToken = null, int validDays = 7)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email, nameof(email));
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName, nameof(fullName));

        var token = string.IsNullOrWhiteSpace(activationToken) ? GenerateSecureToken() : activationToken.Trim();

        return new User
        {
            Id = Guid.NewGuid(),
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = string.Empty,
            Role = UserRole.Student,
            FullName = fullName.Trim(),
            PhoneWhatsapp = phoneWhatsapp?.Trim(),
            ActivationToken = token,
            ActivationTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(validDays),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void ActivateWithPassword(string passwordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash, nameof(passwordHash));
        PasswordHash = passwordHash;
        ActivationToken = null;
        ActivationTokenExpiresAt = null;
    }

    public string RegenerateActivationToken(string? newToken = null, int validDays = 7)
    {
        var token = string.IsNullOrWhiteSpace(newToken) ? GenerateSecureToken() : newToken.Trim();
        ActivationToken = token;
        ActivationTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(validDays);
        return token;
    }

    public bool VerifyPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(PasswordHash))
        {
            return false;
        }
        return BCrypt.Net.BCrypt.Verify(password, PasswordHash);
    }

    public void ChangePassword(string newPasswordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(newPasswordHash, nameof(newPasswordHash));
        PasswordHash = newPasswordHash;
        PasswordResetToken = null;
        PasswordResetTokenExpiresAt = null;
    }

    public string GeneratePasswordResetToken(int validHours = 1)
    {
        var token = GenerateSecureToken();
        PasswordResetToken = token;
        PasswordResetTokenExpiresAt = DateTimeOffset.UtcNow.AddHours(validHours);
        return token;
    }

    public void ResetPasswordWithToken(string newPasswordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(newPasswordHash, nameof(newPasswordHash));
        PasswordHash = newPasswordHash;
        PasswordResetToken = null;
        PasswordResetTokenExpiresAt = null;
    }
}
