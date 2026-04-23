namespace ChatApp.Application.Common;

/// <summary>
/// Standard API response wrapper (optional - use khi cần detailed error info)
/// </summary>
public record ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public ApiError? Error { get; init; }

    public static ApiResponse<T> Ok(T data)
        => new() { Success = true, Data = data };

    public static ApiResponse<T> Fail(string message, int statusCode = 400)
        => new() { Success = false, Error = new ApiError(statusCode, message) };
}

/// <summary>
/// Error details
/// </summary>
public record ApiError
{
    public int StatusCode { get; init; }
    public string Message { get; init; }
    public DateTime Timestamp { get; init; }

    public ApiError(int statusCode, string message, DateTime? timestamp = null)
    {
        StatusCode = statusCode;
        Message = message;
        Timestamp = timestamp ?? DateTime.UtcNow;
    }
}

// Usage Examples:
// Success: return Ok(ApiResponse<UserDto>.Ok(userData));
// Error: return BadRequest(ApiResponse<object>.Fail("Invalid input", 400));
