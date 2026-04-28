using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Auth;

public record VerifyAccountCommand(string Token, string OtpCode) : IRequest<Result<VerifyAccountResponseDto>>;

public record VerifyAccountResponseDto(string Message, Guid UserId);

public class VerifyAccountCommandHandler(
    IUserRepository users,
    IUnitOfWork uow)
    : IRequestHandler<VerifyAccountCommand, Result<VerifyAccountResponseDto>>
{
    public async Task<Result<VerifyAccountResponseDto>> Handle(VerifyAccountCommand request, CancellationToken ct)
    {
        // Tìm user theo verification token
        var allUsers = await users.GetAllAsync(ct);
        var user = allUsers.FirstOrDefault(u => u.VerificationToken == request.Token);

        if (user is null)
            return Result<VerifyAccountResponseDto>.Failure("Invalid verification link.");

        // Allow Customer and Employee, but not Admin
        if (user.AccountType == AccountType.Admin)
            return Result<VerifyAccountResponseDto>.Failure("This verification link is not valid for admin accounts.");

        if (user.ApprovalStatus != ApprovalStatus.Approved)
            return Result<VerifyAccountResponseDto>.Failure("Your account has not been approved yet.");

        // Verify token expiry
        if (!user.VerifyToken(request.Token))
            return Result<VerifyAccountResponseDto>.Failure("Verification link has expired. Please contact admin to resend.");

        // Verify OTP
        if (!user.VerifyOtp(request.OtpCode))
            return Result<VerifyAccountResponseDto>.Failure("Invalid or expired OTP.");

        // Clear verification token sau khi verify thành công
        user.ClearVerificationToken();
        users.Update(user);
        await uow.SaveChangesAsync(ct);

        return Result<VerifyAccountResponseDto>.Success(new VerifyAccountResponseDto(
            "Account verified successfully. Please set your password to complete registration.",
            user.Id));
    }
}
