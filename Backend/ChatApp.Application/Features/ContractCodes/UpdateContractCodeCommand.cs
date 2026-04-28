using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.ContractCodes;

public record UpdateContractCodeCommand(
    Guid Id,
    string Code,
    string CompanyName,
    string? Description,
    bool IsActive) : IRequest<Result<string>>;

public class UpdateContractCodeCommandHandler(
    IContractCodeRepository contractCodes,
    IUnitOfWork uow)
    : IRequestHandler<UpdateContractCodeCommand, Result<string>>
{
    public async Task<Result<string>> Handle(UpdateContractCodeCommand request, CancellationToken ct)
    {
        var contractCode = await contractCodes.GetByIdAsync(request.Id, ct);
        if (contractCode is null)
            return Result<string>.Failure("Contract code not found.");

        // Check if code is changed and already exists
        if (contractCode.Code != request.Code)
        {
            var existing = await contractCodes.GetByCodeAsync(request.Code, ct);
            if (existing is not null && existing.Id != request.Id)
                return Result<string>.Failure($"Contract code '{request.Code}' already exists.");
        }

        contractCode.Update(request.Code, request.CompanyName, request.Description);
        contractCode.SetActive(request.IsActive);

        contractCodes.Update(contractCode);
        await uow.SaveChangesAsync(ct);

        return Result<string>.Success("Contract code updated successfully.");
    }
}
