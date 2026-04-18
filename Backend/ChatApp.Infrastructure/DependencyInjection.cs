using ChatApp.Application.Interfaces;
using ChatApp.Infrastructure.Caching;
using ChatApp.Infrastructure.Persistence;
using ChatApp.Infrastructure.Persistence.Repositories;
using ChatApp.Infrastructure.Services;
using ChatApp.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Minio;
using StackExchange.Redis;

namespace ChatApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // EF Core + SQL Server
        var connStr = config.GetConnectionString("DefaultConnection");
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connStr,
                x => x.MigrationsAssembly("ChatApp.Infrastructure")));

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<IConversationRepository, ConversationRepository>();
        services.AddScoped<IFriendRepository, FriendRepository>();
        services.AddScoped<ICallRepository, CallRepository>();
        services.AddScoped<IBlockedUserRepository, BlockedUserRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Services
        services.AddScoped<IJwtService, JwtService>();

        // Redis (optional — comment out if not available)
        var redisConn = config.GetConnectionString("Redis");
        if (!string.IsNullOrEmpty(redisConn))
        {
            services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConn));
            services.AddScoped<IRedisService, RedisService>();
        }
        else
        {
            services.AddScoped<IRedisService, NoOpRedisService>();
        }

        // MinIO (optional — comment out if not available)
        var minioEndpoint = config["Minio:Endpoint"];
        if (!string.IsNullOrEmpty(minioEndpoint))
        {
            services.AddMinio(client => client
                .WithEndpoint(minioEndpoint)
                .WithCredentials(
                    config["Minio:AccessKey"] ?? "minioadmin",
                    config["Minio:SecretKey"] ?? "minioadmin"));
            services.AddScoped<IStorageService, MinioStorageService>();
        }
        else
        {
            services.AddScoped<IStorageService, LocalStorageService>();
        }

        return services;
    }
}
