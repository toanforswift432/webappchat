using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.ContractCodes;

public record GetActiveContractCodesQuery(int Skip = 0, int Take = 10) : IRequest<Result<PaginatedContractCodesDto>>;

public record ContractCodeDto(Guid Id, string Code, string CompanyName, string? Description);

public record PaginatedContractCodesDto(List<ContractCodeDto> Items, int TotalCount, bool HasMore);

public class GetActiveContractCodesQueryHandler(IContractCodeRepository contractCodes)
    : IRequestHandler<GetActiveContractCodesQuery, Result<PaginatedContractCodesDto>>
{
    public async Task<Result<PaginatedContractCodesDto>> Handle(GetActiveContractCodesQuery request, CancellationToken ct)
    {
        var allCodes = await contractCodes.GetActiveCodesAsync(ct);
        var totalCount = allCodes.Count;

        var pagedCodes = allCodes
            .OrderBy(c => c.Code)
            .Skip(request.Skip)
            .Take(request.Take)
            .ToList();

        var dtos = pagedCodes.Select(c => new ContractCodeDto(c.Id, c.Code, c.CompanyName, c.Description)).ToList();
        var hasMore = (request.Skip + request.Take) < totalCount;

        return Result<PaginatedContractCodesDto>.Success(new PaginatedContractCodesDto(dtos, totalCount, hasMore));
    }
}
