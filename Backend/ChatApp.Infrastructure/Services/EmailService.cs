using ChatApp.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

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

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken ct)
    {
        var host = config["Email:SmtpHost"];
        var port = int.Parse(config["Email:SmtpPort"] ?? "587");
        var user = config["Email:Username"];
        var pass = config["Email:Password"];
        var from = config["Email:FromAddress"] ?? user;
        var fromName = config["Email:FromName"] ?? "AmiChat";
        var enableSsl = bool.Parse(config["Email:EnableSsl"] ?? "true");

        // Nếu chưa config SMTP thì bỏ qua (dev mode)
        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(user))
        {
            Console.WriteLine($"[EmailService] SMTP not configured. OTP for {toEmail}: would send '{subject}'");
            return;
        }

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(user, pass),
            EnableSsl = enableSsl,
        };

        var message = new MailMessage
        {
            From = new MailAddress(from!, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(toEmail);

        await client.SendMailAsync(message, ct);
    }
}
