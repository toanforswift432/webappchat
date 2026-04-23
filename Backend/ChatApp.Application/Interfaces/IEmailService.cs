namespace ChatApp.Application.Interfaces;

public interface IEmailService
{
    Task SendOtpAsync(string toEmail, string displayName, string otpCode, CancellationToken ct = default);
    Task SendApprovalNotificationAsync(string toEmail, string displayName, bool approved, CancellationToken ct = default);
}
