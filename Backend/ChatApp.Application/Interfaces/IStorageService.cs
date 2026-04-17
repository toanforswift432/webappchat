namespace ChatApp.Application.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string objectName, CancellationToken ct = default);
    string GetPublicUrl(string objectName);
}
