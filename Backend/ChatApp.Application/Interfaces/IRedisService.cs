namespace ChatApp.Application.Interfaces;

public interface IRedisService
{
    Task SetAsync(string key, string value, TimeSpan? expiry = null);
    Task<string?> GetAsync(string key);
    Task DeleteAsync(string key);
    Task DeleteManyAsync(params string[] keys);
    Task<bool> ExistsAsync(string key);
    Task SetJsonAsync<T>(string key, T value, TimeSpan? expiry = null);
    Task<T?> GetJsonAsync<T>(string key);
    Task SetUserOnlineAsync(Guid userId);
    Task SetUserOfflineAsync(Guid userId);
    Task<bool> IsUserOnlineAsync(Guid userId);
}
