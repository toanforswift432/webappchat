using ChatApp.Application.Interfaces;
using StackExchange.Redis;

namespace ChatApp.Infrastructure.Caching;

public class RedisService(IConnectionMultiplexer redis) : IRedisService
{
    private readonly IDatabase _db = redis.GetDatabase();

    public Task SetAsync(string key, string value, TimeSpan? expiry = null)
    {
        if (expiry.HasValue)
            return _db.StringSetAsync(key, value, expiry.Value);
        return _db.StringSetAsync(key, value);
    }

    public async Task<string?> GetAsync(string key)
    {
        var value = await _db.StringGetAsync(key);
        return value.HasValue ? value.ToString() : null;
    }

    public Task DeleteAsync(string key) => _db.KeyDeleteAsync(key);

    public Task<bool> ExistsAsync(string key) => _db.KeyExistsAsync(key);

    public Task SetUserOnlineAsync(Guid userId)
        => _db.StringSetAsync($"online:{userId}", "1", TimeSpan.FromMinutes(5));

    public Task SetUserOfflineAsync(Guid userId)
        => _db.KeyDeleteAsync($"online:{userId}");

    public Task<bool> IsUserOnlineAsync(Guid userId)
        => _db.KeyExistsAsync($"online:{userId}");
}
