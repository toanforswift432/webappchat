using System.Text.Json;
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

    public Task DeleteManyAsync(params string[] keys)
    {
        if (keys.Length == 0) return Task.CompletedTask;
        var redisKeys = keys.Select(k => (RedisKey)k).ToArray();
        return _db.KeyDeleteAsync(redisKeys);
    }

    public Task<bool> ExistsAsync(string key) => _db.KeyExistsAsync(key);

    public Task SetJsonAsync<T>(string key, T value, TimeSpan? expiry = null)
        => SetAsync(key, JsonSerializer.Serialize(value), expiry);

    public async Task<T?> GetJsonAsync<T>(string key)
    {
        var json = await GetAsync(key);
        if (json is null) return default;
        return JsonSerializer.Deserialize<T>(json);
    }

    public Task SetUserOnlineAsync(Guid userId)
        => _db.StringSetAsync($"online:{userId}", "1", TimeSpan.FromMinutes(5));

    public Task SetUserOfflineAsync(Guid userId)
        => _db.KeyDeleteAsync($"online:{userId}");

    public Task<bool> IsUserOnlineAsync(Guid userId)
        => _db.KeyExistsAsync($"online:{userId}");
}
