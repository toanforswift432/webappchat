using System.Text;
using BCrypt.Net;
using ChatApp.Application;
using ChatApp.Infrastructure;
using ChatApp.API.Hubs;
using ChatApp.API.Middleware;
using ChatApp.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// HttpClient factory (used by TurnController to call Metered API)
builder.Services.AddHttpClient();

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Nhập JWT token: Bearer {token}"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Application + Infrastructure layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };

        // Allow JWT via query string for SignalR
        opts.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var accessToken = ctx.Request.Query["access_token"];
                var path = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    ctx.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// SignalR with optional Redis backplane for horizontal scaling
var redisConn = builder.Configuration.GetConnectionString("Redis");
var signalR = builder.Services.AddSignalR();
if (!string.IsNullOrEmpty(redisConn))
    signalR.AddStackExchangeRedis(redisConn, opts =>
        opts.Configuration.ChannelPrefix = StackExchange.Redis.RedisChannel.Literal("ChatApp"));

// CORS — allow frontend dev server
builder.Services.AddCors(opts =>
    opts.AddPolicy("FrontendDev", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

var app = builder.Build();

// Auto-migrate + seed admin on startup
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    // Seed admin account if none exists
    if (!db.Users.Any(u => u.AccountType == ChatApp.Domain.Enums.AccountType.Admin))
    {
        var adminEmail = builder.Configuration["AdminSeed:Email"] ?? "admin@amichat.local";
        var adminPass  = builder.Configuration["AdminSeed:Password"] ?? "Admin@123456";
        var adminName  = builder.Configuration["AdminSeed:DisplayName"] ?? "System Admin";
        var hash = BCrypt.Net.BCrypt.HashPassword(adminPass);
        var admin = ChatApp.Domain.Entities.User.CreateAdmin(adminEmail, hash, adminName);
        db.Users.Add(admin);
        await db.SaveChangesAsync();
        Console.WriteLine($"[Seed] Admin account created: {adminEmail}");
    }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseMiddleware<ExceptionMiddleware>();

// Serve static files from uploads folder
var uploadsPath = builder.Configuration["Storage:LocalPath"];
if (string.IsNullOrEmpty(uploadsPath))
{
    uploadsPath = Path.Combine(AppContext.BaseDirectory, "uploads");
}
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Serve frontend static files with a custom middleware to avoid UseStaticFiles RequestPath issues
var frontendRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "webappchat");
var mimeTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
{
    { ".js",   "application/javascript" },
    { ".css",  "text/css" },
    { ".html", "text/html; charset=utf-8" },
    { ".svg",  "image/svg+xml" },
    { ".png",  "image/png" },
    { ".jpg",  "image/jpeg" },
    { ".ico",  "image/x-icon" },
    { ".json", "application/json" },
    { ".woff", "font/woff" },
    { ".woff2","font/woff2" },
};
app.Use(async (ctx, next) =>
{
    var reqPath = ctx.Request.Path.Value ?? "";
    if (reqPath.StartsWith("/webappchat/", StringComparison.OrdinalIgnoreCase))
    {
        var relative = reqPath["/webappchat/".Length..].Replace('/', Path.DirectorySeparatorChar);
        var filePath = Path.Combine(frontendRoot, relative);
        if (File.Exists(filePath) && mimeTypes.TryGetValue(Path.GetExtension(filePath), out var mime))
        {
            ctx.Response.ContentType = mime;
            ctx.Response.Headers["Cache-Control"] = "public, max-age=31536000, immutable";
            await ctx.Response.SendFileAsync(filePath);
            return;
        }
    }
    await next();
});

app.UseCors("FrontendDev");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

// SPA fallback: serve wwwroot/webappchat/index.html for any /webappchat/* path
app.MapFallback("/webappchat/{**path}", async (HttpContext ctx, IWebHostEnvironment env) =>
{
    var indexPath = Path.Combine(
        env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"),
        "webappchat", "index.html");
    if (File.Exists(indexPath))
    {
        ctx.Response.ContentType = "text/html; charset=utf-8";
        await ctx.Response.SendFileAsync(indexPath);
    }
    else
    {
        ctx.Response.StatusCode = 404;
    }
});

app.MapGet("/", () => Results.Redirect("/webappchat/"));

app.Run();
