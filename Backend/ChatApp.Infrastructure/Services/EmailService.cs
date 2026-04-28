using ChatApp.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace ChatApp.Infrastructure.Services;

public class EmailService(IConfiguration config) : IEmailService
{
    public async Task SendOtpAsync(string toEmail, string displayName, string otpCode, CancellationToken ct = default)
    {
        var subject = "AmiChat — Mã xác thực OTP của bạn";
        var body = $"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #6366f1;">AmiChat</h2>
              <p>Xin chào <strong>{displayName}</strong>,</p>
              <p>Mã OTP xác thực tài khoản của bạn là:</p>
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1; text-align: center; padding: 16px; background: #f5f3ff; border-radius: 8px; margin: 16px 0;">
                {otpCode}
              </div>
              <p>Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
              <p style="color: #9ca3af; font-size: 12px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
            </div>
            """;

        await SendEmailAsync(toEmail, subject, body, ct);
    }

    public async Task SendApprovalNotificationAsync(string toEmail, string displayName, bool approved, CancellationToken ct = default)
    {
        var subject = approved
            ? "AmiChat — Tài khoản của bạn đã được duyệt"
            : "AmiChat — Tài khoản của bạn đã bị từ chối";

        var body = approved
            ? $"""
               <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
                 <h2 style="color: #6366f1;">AmiChat</h2>
                 <p>Xin chào <strong>{displayName}</strong>,</p>
                 <p>Tài khoản nhân viên của bạn đã được <span style="color: #22c55e; font-weight: bold;">duyệt thành công</span>.</p>
                 <p>Bạn có thể đăng nhập vào hệ thống ngay bây giờ.</p>
               </div>
               """
            : $"""
               <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
                 <h2 style="color: #6366f1;">AmiChat</h2>
                 <p>Xin chào <strong>{displayName}</strong>,</p>
                 <p>Rất tiếc, tài khoản nhân viên của bạn đã <span style="color: #ef4444; font-weight: bold;">bị từ chối</span>.</p>
                 <p>Vui lòng liên hệ quản trị viên để biết thêm thông tin.</p>
               </div>
               """;

        await SendEmailAsync(toEmail, subject, body, ct);
    }

    public async Task SendRegistrationPendingAsync(string toEmail, string displayName, CancellationToken ct = default)
    {
        var subject = "AmiChat — Đăng ký tài khoản thành công";
        var body = $"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #6366f1;">AmiChat</h2>
              <p>Xin chào <strong>{displayName}</strong>,</p>
              <p>Cảm ơn bạn đã đăng ký tài khoản AmiChat.</p>
              <p>Tài khoản của bạn đang <strong>chờ quản trị viên duyệt</strong>.</p>
              <p>Bạn sẽ nhận được email thông báo kèm hướng dẫn kích hoạt tài khoản sau khi được phê duyệt.</p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Nếu bạn không yêu cầu đăng ký này, hãy bỏ qua email.</p>
            </div>
            """;

        await SendEmailAsync(toEmail, subject, body, ct);
    }

    public async Task SendCustomerApprovalWithVerificationAsync(string toEmail, string displayName, string otpCode, string verificationToken, CancellationToken ct = default)
    {
        // URL frontend để verify account (có thể config trong appsettings)
        var frontendUrl = config["Frontend:BaseUrl"] ?? "http://localhost:5173";
        var verificationLink = $"{frontendUrl}/verify-account/{verificationToken}";

        var subject = "AmiChat — Tài khoản của bạn đã được duyệt";
        var body = $"""
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #6366f1;">AmiChat</h2>
              <p>Xin chào <strong>{displayName}</strong>,</p>
              <p>Tài khoản của bạn đã được <span style="color: #22c55e; font-weight: bold;">duyệt thành công</span>!</p>

              <p style="margin-top: 20px;">Để kích hoạt tài khoản, vui lòng:</p>
              <ol style="line-height: 1.8;">
                <li>Click vào link bên dưới để truy cập trang xác thực</li>
                <li>Nhập mã OTP: <strong style="color: #6366f1; font-size: 18px;">{otpCode}</strong></li>
                <li>Thiết lập mật khẩu cho tài khoản của bạn</li>
                <li>Đăng nhập vào hệ thống</li>
              </ol>

              <div style="text-align: center; margin: 24px 0;">
                <a href="{verificationLink}" style="display: inline-block; padding: 12px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Xác thực tài khoản
                </a>
              </div>

              <p style="color: #ef4444; font-weight: bold; margin-top: 20px;">⚠️ Link này chỉ có hiệu lực trong <strong>1 giờ</strong>.</p>
              <p style="color: #9ca3af; font-size: 12px;">Nếu link hết hạn, vui lòng liên hệ quản trị viên để được gửi lại.</p>

              <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 11px;">Link xác thực: <br/><code style="word-break: break-all;">{verificationLink}</code></p>
            </div>
            """;

        await SendEmailAsync(toEmail, subject, body, ct);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken ct)
    {
        var apiKey = config["SendGrid:ApiKey"];
        var fromEmail = config["SendGrid:FromEmail"];
        var fromName = config["SendGrid:FromName"] ?? "AmiChat";

        // Nếu chưa config SendGrid thì log chi tiết (dev mode)
        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(fromEmail))
        {
            Console.WriteLine($"\n========== [EmailService - DEV MODE] ==========");
            Console.WriteLine($"To: {toEmail}");
            Console.WriteLine($"Subject: {subject}");
            Console.WriteLine($"HTML Body Preview (first 500 chars):");
            Console.WriteLine(htmlBody.Length > 500 ? htmlBody.Substring(0, 500) + "..." : htmlBody);
            Console.WriteLine($"===============================================\n");
            return;
        }

        var client = new SendGridClient(apiKey);
        var from = new EmailAddress(fromEmail, fromName);
        var to = new EmailAddress(toEmail);
        var msg = MailHelper.CreateSingleEmail(from, to, subject, null, htmlBody);

        var response = await client.SendEmailAsync(msg, ct);

        if (response.IsSuccessStatusCode)
        {
            Console.WriteLine($"[EmailService] Email sent successfully to {toEmail} via SendGrid");
        }
        else
        {
            var errorBody = await response.Body.ReadAsStringAsync(ct);
            Console.WriteLine($"[EmailService] Failed to send email to {toEmail}. Status: {response.StatusCode}, Error: {errorBody}");
            throw new Exception($"SendGrid failed with status {response.StatusCode}: {errorBody}");
        }
    }
}
