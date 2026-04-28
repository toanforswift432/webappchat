using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Enums;
using MediatR;
using System.Security.Cryptography;
using System.Text;

namespace ChatApp.Application.Features.Admin;

public record ApproveAccountCommand(Guid TargetUserId, bool Approve) : IRequest<Result<bool>>;

public class ApproveAccountCommandHandler(
    IUserRepository users,
    IEmailService email,
    IUnitOfWork uow)
    : IRequestHandler<ApproveAccountCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ApproveAccountCommand request, CancellationToken ct)
    {
        var user = await users.GetByIdAsync(request.TargetUserId, ct);
        if (user is null)
            return Result<bool>.Failure("User not found.");

        if (user.ApprovalStatus != ApprovalStatus.Pending)
            return Result<bool>.Failure("Account is not in pending state.");

        if (request.Approve)
        {
            user.Approve();

            // Customer: Tạo OTP + verification token + gửi email với link
            if (user.AccountType == AccountType.Customer)
            {
                var otp = GenerateOtp();
                user.SetOtp(otp, DateTime.UtcNow.AddMinutes(10));

                var token = GenerateVerificationToken();
                user.SetVerificationToken(token, DateTime.UtcNow.AddHours(1));

                await uow.SaveChangesAsync(ct);

                // Gửi email với OTP và link verification
                await email.SendCustomerApprovalWithVerificationAsync(user.Email, user.DisplayName, otp, token, ct);
            }
            // Employee: Chỉ gửi email thông báo approved
            else if (user.AccountType == AccountType.Employee)
            {
                await uow.SaveChangesAsync(ct);
                await email.SendApprovalNotificationAsync(user.Email, user.DisplayName, request.Approve, ct);
            }
        }
        else
        {
            user.Reject();
            await uow.SaveChangesAsync(ct);
            await email.SendApprovalNotificationAsync(user.Email, user.DisplayName, request.Approve, ct);
        }

        return Result<bool>.Success(request.Approve);
    }

    private static string GenerateOtp() => Random.Shared.Next(100000, 999999).ToString();

    private static string GenerateVerificationToken()
    {
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }
}
