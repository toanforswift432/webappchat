using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.ContractCodes;

public record CreateContractCodeCommand(
    string Code,
    string CompanyName,
    string? Description) : IRequest<Result<CreateContractCodeResponseDto>>;

public record CreateContractCodeResponseDto(Guid Id, string Message);

public class CreateContractCodeCommandHandler(
    IContractCodeRepository contractCodes,
    IUnitOfWork uow)
    : IRequestHandler<CreateContractCodeCommand, Result<CreateContractCodeResponseDto>>
{
    public async Task<Result<CreateContractCodeResponseDto>> Handle(CreateContractCodeCommand request, CancellationToken ct)
    {
        // Check if code already exists
        var existing = await contractCodes.GetByCodeAsync(request.Code, ct);
        if (existing is not null)
            return Result<CreateContractCodeResponseDto>.Failure($"Contract code '{request.Code}' already exists.");

        var contractCode = ContractCode.Create(request.Code, request.CompanyName, request.Description);

        await contractCodes.AddAsync(contractCode, ct);
        await uow.SaveChangesAsync(ct);

        return Result<CreateContractCodeResponseDto>.Success(new CreateContractCodeResponseDto(
            contractCode.Id,
            "Contract code created successfully."));
    }
}
