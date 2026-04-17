using System.Net;
using System.Text.Json;

namespace ChatApp.API.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            var response = JsonSerializer.Serialize(new { error = "An unexpected error occurred." });
            await context.Response.WriteAsync(response);
        }
    }
}
