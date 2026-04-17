using ChatApp.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace ChatApp.Infrastructure.Storage;

public class LocalStorageService(IConfiguration config) : IStorageService
{
    private readonly string _uploadPath = config["Storage:LocalPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads");

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default)
    {
        Directory.CreateDirectory(_uploadPath);
        var objectName = $"{Guid.NewGuid()}_{fileName}";
        var filePath = Path.Combine(_uploadPath, objectName);
        using var fs = File.Create(filePath);
        await fileStream.CopyToAsync(fs, ct);
        return objectName;
    }

    public Task DeleteAsync(string objectName, CancellationToken ct = default)
    {
        var filePath = Path.Combine(_uploadPath, objectName);
        if (File.Exists(filePath)) File.Delete(filePath);
        return Task.CompletedTask;
    }

    public string GetPublicUrl(string objectName) => $"/uploads/{objectName}";
}
