using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Auth;

public record VerifyOtpCommand(string EmailOrPhone, string OtpCode) : IRequest<Result<VerifyOtpResponseDto>>;

public record VerifyOtpResponseDto(
    string Message,
    bool RequiresApproval,
    // JWT tokens chỉ trả khi không cần duyệt (Customer)
    string? AccessToken = null,
    string? RefreshToken = null,
    UserDto? User = null);

public class VerifyOtpCommandHandler(
    IUserRepository users,
    IJwtService jwt,
    IUnitOfWork uow)
    : IRequestHandler<VerifyOtpCommand, Result<VerifyOtpResponseDto>>
{
    public async Task<Result<VerifyOtpResponseDto>> Handle(VerifyOtpCommand request, CancellationToken ct)
    {
        // Tìm user theo email hoặc phone
        var user = await users.GetByEmailAsync(request.EmailOrPhone, ct);
        user ??= await users.GetByPhoneAsync(request.EmailOrPhone, ct);

        if (user is null)
            return Result<VerifyOtpResponseDto>.Failure("Account not found.");

        if (user.IsVerified)
            return Result<VerifyOtpResponseDto>.Failure("Account already verified.");

        if (!user.VerifyOtp(request.OtpCode))
            return Result<VerifyOtpResponseDto>.Failure("Invalid or expired OTP.");

        users.Update(user);
        await uow.SaveChangesAsync(ct);

        // Employee: OTP verified nhưng còn chờ admin duyệt
        if (user.AccountType == AccountType.Employee)
        {
            return Result<VerifyOtpResponseDto>.Success(new VerifyOtpResponseDto(
                "Email verified. Your account is pending admin approval.", RequiresApproval: true));
        }

        // Customer: verified xong là login ngay
        var accessToken = jwt.GenerateAccessToken(user);
        var refreshToken = jwt.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(30));
        users.Update(user);
        await uow.SaveChangesAsync(ct);

        return Result<VerifyOtpResponseDto>.Success(new VerifyOtpResponseDto(
            "Email verified successfully.",
            RequiresApproval: false,
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            User: user.ToDto()));
    }
}
