using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FileController(IConfiguration config) : ControllerBase
{
    [HttpGet("download")]
    public IActionResult Download([FromQuery] string path)
    {
        if (string.IsNullOrEmpty(path) || path.Contains(".."))
            return BadRequest("Invalid file path.");

        // Remove leading /uploads/ if present
        var fileName = path.StartsWith("/uploads/") ? path[9..] : path;

        var uploadsPath = config["Storage:LocalPath"];
        if (string.IsNullOrEmpty(uploadsPath))
            uploadsPath = Path.Combine(AppContext.BaseDirectory, "uploads");

        var filePath = Path.Combine(uploadsPath, fileName);

        if (!System.IO.File.Exists(filePath))
            return NotFound("File not found.");

        var fileBytes = System.IO.File.ReadAllBytes(filePath);
        var contentType = GetContentType(fileName);
        var downloadName = Path.GetFileName(fileName);

        // Force download with Content-Disposition header
        return File(fileBytes, contentType, downloadName);
    }

    private static string GetContentType(string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".ppt" => "application/vnd.ms-powerpoint",
            ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            ".txt" => "text/plain",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".zip" => "application/zip",
            ".rar" => "application/x-rar-compressed",
            _ => "application/octet-stream"
        };
    }
}
