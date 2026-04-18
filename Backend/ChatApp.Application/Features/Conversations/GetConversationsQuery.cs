using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Conversations;

public record GetConversationsQuery(Guid UserId) : IRequest<Result<List<ConversationDto>>>;

public class GetConversationsQueryHandler(IConversationRepository conversations)
    : IRequestHandler<GetConversationsQuery, Result<List<ConversationDto>>>
{
    public async Task<Result<List<ConversationDto>>> Handle(GetConversationsQuery req, CancellationToken ct)
    {
        var convs = await conversations.GetByUserIdAsync(req.UserId, ct);

        var dtos = convs.Select(c =>
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

            return new ConversationDto(c.Id, c.Name, c.AvatarUrl, c.Type, members, lastMsgDto, unreadCount, c.CreatedAt, isMuted);
        }).ToList();

        return Result<List<ConversationDto>>.Success(dtos);
    }
}
