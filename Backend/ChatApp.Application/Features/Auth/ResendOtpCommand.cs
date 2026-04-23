using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Auth;

public record ResendOtpCommand(string EmailOrPhone) : IRequest<Result<ResendOtpResponseDto>>;

public record ResendOtpResponseDto(string Message, string MaskedEmail, string? OtpCode = null);

public class ResendOtpCommandHandler(
    IUserRepository users,
    IEmailService email,
    IUnitOfWork uow)
    : IRequestHandler<ResendOtpCommand, Result<ResendOtpResponseDto>>
{
    public async Task<Result<ResendOtpResponseDto>> Handle(ResendOtpCommand request, CancellationToken ct)
    {
        // Tìm user theo email hoặc phone
        var user = await users.GetByEmailAsync(request.EmailOrPhone, ct);
        user ??= await users.GetByPhoneAsync(request.EmailOrPhone, ct);

        if (user is null)
            return Result<ResendOtpResponseDto>.Failure("No account found with this email or phone number.");

        // Kiểm tra đã verify chưa
        if (user.IsVerified)
            return Result<ResendOtpResponseDto>.Failure("This account is already verified. Please login instead.");

        // Kiểm tra limit resend
        if (!user.CanResendOtp())
            return Result<ResendOtpResponseDto>.Failure("You have reached the maximum OTP resend limit (5 times per 24 hours). Please try again later.");

        // Generate OTP mới
        var otp = GenerateOtp();
        user.SetOtp(otp, DateTime.UtcNow.AddMinutes(10));
        user.IncrementResendCount();

        users.Update(user);
        await uow.SaveChangesAsync(ct);

        // Gửi email
        await email.SendOtpAsync(user.Email, user.DisplayName, otp, ct);

        // Mask email: a***@example.com
        var maskedEmail = MaskEmail(user.Email);

        return Result<ResendOtpResponseDto>.Success(new ResendOtpResponseDto(
            "OTP has been resent to your email.", maskedEmail, otp)); // Return OTP for dev/test
    }

    private static string GenerateOtp() => Random.Shared.Next(100000, 999999).ToString();

    private static string MaskEmail(string email)
    {
        var parts = email.Split('@');
        if (parts.Length != 2) return email;

        var localPart = parts[0];
        var domain = parts[1];

        if (localPart.Length <= 2)
            return $"{localPart[0]}***@{domain}";

        return $"{localPart[0]}***{localPart[^1]}@{domain}";
    }
}
