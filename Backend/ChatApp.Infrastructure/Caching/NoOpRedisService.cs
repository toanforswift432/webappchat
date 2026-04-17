using ChatApp.Application.Interfaces;

namespace ChatApp.Infrastructure.Caching;

public class NoOpRedisService : IRedisService
{
    public Task SetAsync(string key, string value, TimeSpan? expiry = null) => Task.CompletedTask;
    public Task<string?> GetAsync(string key) => Task.FromResult<string?>(null);
    public Task DeleteAsync(string key) => Task.CompletedTask;
    public Task<bool> ExistsAsync(string key) => Task.FromResult(false);
    public Task SetUserOnlineAsync(Guid userId) => Task.CompletedTask;
    public Task SetUserOfflineAsync(Guid userId) => Task.CompletedTask;
    public Task<bool> IsUserOnlineAsync(Guid userId) => Task.FromResult(false);
}
