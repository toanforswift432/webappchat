using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.ContractCodes;

public record DeleteContractCodeCommand(Guid Id) : IRequest<Result<string>>;

public class DeleteContractCodeCommandHandler(
    IContractCodeRepository contractCodes,
    IUserRepository users,
    IUnitOfWork uow)
    : IRequestHandler<DeleteContractCodeCommand, Result<string>>
{
    public async Task<Result<string>> Handle(DeleteContractCodeCommand request, CancellationToken ct)
    {
        var contractCode = await contractCodes.GetByIdAsync(request.Id, ct);
        if (contractCode is null)
            return Result<string>.Failure("Contract code not found.");

        // Check if any users are using this contract code
        var allUsers = await users.GetAllAsync(ct);
        var hasUsers = allUsers.Any(u => u.ContractCodeId == request.Id);

        if (hasUsers)
            return Result<string>.Failure("Cannot delete contract code. It is being used by registered customers.");

        contractCodes.Delete(contractCode);
        await uow.SaveChangesAsync(ct);

        return Result<string>.Success("Contract code deleted successfully.");
    }
}
