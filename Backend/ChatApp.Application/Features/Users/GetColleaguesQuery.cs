using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Users;

public record GetColleaguesQuery(Guid UserId) : IRequest<Result<List<ColleagueDto>>>;

public class GetColleaguesQueryHandler(IUserRepository users, IContractCodeRepository contractCodes)
    : IRequestHandler<GetColleaguesQuery, Result<List<ColleagueDto>>>
{
    public async Task<Result<List<ColleagueDto>>> Handle(GetColleaguesQuery req, CancellationToken ct)
    {
        // Get current user's ContractCodeId
        var currentUser = await users.GetByIdAsync(req.UserId, ct);
        if (currentUser is null || currentUser.ContractCodeId is null)
        {
            return Result<List<ColleagueDto>>.Success(new List<ColleagueDto>());
        }

        // Get ContractCode info
        var contractCode = await contractCodes.GetByIdAsync(currentUser.ContractCodeId.Value, ct);
        if (contractCode is null)
        {
            return Result<List<ColleagueDto>>.Success(new List<ColleagueDto>());
        }

        // Get all users
        var allUsers = await users.GetAllAsync(ct);

        // Filter colleagues: same ContractCodeId, not current user, verified, approved
        var colleagues = allUsers
            .Where(u => u.ContractCodeId == currentUser.ContractCodeId
                     && u.Id != req.UserId
                     && u.IsVerified
                     && u.ApprovalStatus == Domain.Enums.ApprovalStatus.Approved)
            .OrderBy(u => u.DisplayName)
            .Select(u => new ColleagueDto(
                u.Id,
                u.Email,
                u.DisplayName,
                u.PhoneNumber,
                u.AvatarUrl,
                u.Status,
                u.LastSeenAt,
                u.ContractCodeId,
                contractCode.CompanyName
            ))
            .ToList();

        return Result<List<ColleagueDto>>.Success(colleagues);
    }
}
