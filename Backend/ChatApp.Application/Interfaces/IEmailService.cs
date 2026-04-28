namespace ChatApp.Application.Interfaces;

public interface IEmailService
{
    Task SendOtpAsync(string toEmail, string displayName, string otpCode, CancellationToken ct = default);
    Task SendApprovalNotificationAsync(string toEmail, string displayName, bool approved, CancellationToken ct = default);
    Task SendRegistrationPendingAsync(string toEmail, string displayName, CancellationToken ct = default);
    Task SendCustomerApprovalWithVerificationAsync(string toEmail, string displayName, string otpCode, string verificationToken, CancellationToken ct = default);
}
