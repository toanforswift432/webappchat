using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Auth;

public record SetPasswordCommand(Guid UserId, string Password) : IRequest<Result<SetPasswordResponseDto>>;

public record SetPasswordResponseDto(string Message);

public class SetPasswordCommandHandler(
    IUserRepository users,
    IUnitOfWork uow)
    : IRequestHandler<SetPasswordCommand, Result<SetPasswordResponseDto>>
{
    public async Task<Result<SetPasswordResponseDto>> Handle(SetPasswordCommand request, CancellationToken ct)
    {
        var user = await users.GetByIdAsync(request.UserId, ct);
        if (user is null)
            return Result<SetPasswordResponseDto>.Failure("User not found.");

        // Allow Customer and Employee, but not Admin
        if (user.AccountType == AccountType.Admin)
            return Result<SetPasswordResponseDto>.Failure("This operation is not valid for admin accounts.");

        if (!user.IsVerified)
            return Result<SetPasswordResponseDto>.Failure("Account must be verified before setting password.");

        if (user.ApprovalStatus != ApprovalStatus.Approved)
            return Result<SetPasswordResponseDto>.Failure("Account must be approved before setting password.");

        // Validate password strength (optional - có thể thêm validation)
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            return Result<SetPasswordResponseDto>.Failure("Password must be at least 6 characters.");

        var hash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        user.SetPassword(hash);
        users.Update(user);
        await uow.SaveChangesAsync(ct);

        return Result<SetPasswordResponseDto>.Success(new SetPasswordResponseDto(
            "Password set successfully. You can now login with your email and password."));
    }
}
