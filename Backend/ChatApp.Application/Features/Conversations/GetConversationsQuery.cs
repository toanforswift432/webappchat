using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Conversations;

public record GetConversationsQuery(Guid UserId) : IRequest<Result<List<ConversationDto>>>;

public class GetConversationsQueryHandler(
    IConversationRepository conversations,
    IRedisService redis,
    IUserRepository users,
    IContractCodeRepository contractCodes)
    : IRequestHandler<GetConversationsQuery, Result<List<ConversationDto>>>
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(30);

    public async Task<Result<List<ConversationDto>>> Handle(GetConversationsQuery req, CancellationToken ct)
    {
        var cacheKey = $"conv:list:{req.UserId}";
        var cached = await redis.GetJsonAsync<List<ConversationDto>>(cacheKey);
        if (cached is not null)
            return Result<List<ConversationDto>>.Success(cached);

        var convs = await conversations.GetByUserIdAsync(req.UserId, ct);
        var currentUser = await users.GetByIdAsync(req.UserId, ct);

        var dtos = new List<ConversationDto>();
        foreach (var c in convs)
        {
            var members = c.Members.Select(m => new ConversationMemberDto(
                m.UserId, m.User.DisplayName, m.User.AvatarUrl, m.Role, m.User.Status)).ToList();

            var lastMsg = c.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();
            MessageDto? lastMsgDto = null;
            if (lastMsg is not null)
            {
                lastMsgDto = new MessageDto(lastMsg.Id, lastMsg.ConversationId, lastMsg.SenderId,
                    lastMsg.Sender?.DisplayName ?? "", lastMsg.Sender?.AvatarUrl,
                    lastMsg.Type, lastMsg.Content, lastMsg.FileUrl, lastMsg.FileName, lastMsg.FileSize,
                    lastMsg.ReplyToMessageId, lastMsg.IsRecalled, lastMsg.IsPinned, [], lastMsg.CreatedAt);
            }

            var unread = c.Members.FirstOrDefault(m => m.UserId == req.UserId);
            var unreadCount = unread?.LastReadAt is null
                ? c.Messages.Count
                : c.Messages.Count(m => m.CreatedAt > unread.LastReadAt);

            var isMuted = unread?.IsMuted ?? false;

            // Check if this is a colleague conversation (direct chat with same ContractCodeId)
            var isColleague = false;
            string? companyName = null;

            if (c.Type == ConversationType.Direct && currentUser?.ContractCodeId is not null)
            {
                var otherMember = c.Members.FirstOrDefault(m => m.UserId != req.UserId);
                if (otherMember?.User?.ContractCodeId == currentUser.ContractCodeId)
                {
                    isColleague = true;
                    var contractCode = await contractCodes.GetByIdAsync(currentUser.ContractCodeId.Value, ct);
                    companyName = contractCode?.CompanyName;
                }
            }

            dtos.Add(new ConversationDto(c.Id, c.Name, c.AvatarUrl, c.Type, members, lastMsgDto,
                unreadCount, c.CreatedAt, isMuted, isColleague, companyName));
        }

        await redis.SetJsonAsync(cacheKey, dtos, CacheTtl);
        return Result<List<ConversationDto>>.Success(dtos);
    }
}
