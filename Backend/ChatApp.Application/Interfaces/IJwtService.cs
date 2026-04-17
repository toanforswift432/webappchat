using ChatApp.Domain.Entities;

namespace ChatApp.Application.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    Guid? GetUserIdFromToken(string token);
}
