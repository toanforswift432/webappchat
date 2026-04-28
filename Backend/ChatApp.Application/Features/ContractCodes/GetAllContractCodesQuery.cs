using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.ContractCodes;

public record GetAllContractCodesQuery : IRequest<Result<List<ContractCodeDetailDto>>>;

public record ContractCodeDetailDto(
    Guid Id,
    string Code,
    string CompanyName,
    string? Description,
    bool IsActive,
    DateTime CreatedAt);

public class GetAllContractCodesQueryHandler(IContractCodeRepository contractCodes)
    : IRequestHandler<GetAllContractCodesQuery, Result<List<ContractCodeDetailDto>>>
{
    public async Task<Result<List<ContractCodeDetailDto>>> Handle(GetAllContractCodesQuery request, CancellationToken ct)
    {
        var codes = await contractCodes.GetAllAsync(ct);
        var dtos = codes.Select(c => new ContractCodeDetailDto(
            c.Id,
            c.Code,
            c.CompanyName,
            c.Description,
            c.IsActive,
            c.CreatedAt
        )).ToList();

        return Result<List<ContractCodeDetailDto>>.Success(dtos);
    }
}
