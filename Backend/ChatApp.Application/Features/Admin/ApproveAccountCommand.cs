using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Enums;
using MediatR;

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

        if (user.AccountType != AccountType.Employee)
            return Result<bool>.Failure("Only employee accounts require approval.");

        if (user.ApprovalStatus != ApprovalStatus.Pending)
            return Result<bool>.Failure("Account is not in pending state.");

        if (request.Approve)
            user.Approve();
        else
            user.Reject();

        users.Update(user);
        await uow.SaveChangesAsync(ct);

        await email.SendApprovalNotificationAsync(user.Email, user.DisplayName, request.Approve, ct);

        return Result<bool>.Success(request.Approve);
    }
}
