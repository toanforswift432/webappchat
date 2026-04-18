using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using MediatR;

namespace ChatApp.Application.Features.Messages;

public record GetMessagesQuery(Guid ConversationId, Guid RequesterId, int Page = 1, int PageSize = 50)
    : IRequest<Result<List<MessageDto>>>;

public class GetMessagesQueryHandler(
    IMessageRepository messages,
    IConversationRepository conversations,
    IUserRepository users)
    : IRequestHandler<GetMessagesQuery, Result<List<MessageDto>>>
{
    public async Task<Result<List<MessageDto>>> Handle(GetMessagesQuery req, CancellationToken ct)
    {
        var member = await conversations.GetMemberAsync(req.ConversationId, req.RequesterId, ct);
        if (member is null)
            return Result<List<MessageDto>>.Failure("Not a member of this conversation.");

        var msgs = await messages.GetByConversationAsync(req.ConversationId, req.Page, req.PageSize, ct);
        var senderIds = msgs.Select(m => m.SenderId).Where(id => id.HasValue).Select(id => id!.Value).Distinct();
        var senders = (await users.GetByIdsAsync(senderIds, ct)).ToDictionary(u => u.Id);

        var dtos = msgs.Select(m =>
        {
            User? sender = null;
            if (m.SenderId.HasValue) senders.TryGetValue(m.SenderId.Value, out sender);
            var reactions = m.Reactions
                .GroupBy(r => r.Emoji)
                .Select(g => new ReactionDto(g.Key, g.Select(r => r.UserId).ToList()))
                .ToList();
            return new MessageDto(
                m.Id, m.ConversationId, m.SenderId,
                sender?.DisplayName ?? "Unknown", sender?.AvatarUrl,
                m.Type, m.Content, m.FileUrl, m.FileName, m.FileSize,
                m.ReplyToMessageId, m.IsRecalled, m.IsPinned,
                reactions, m.CreatedAt);
        }).ToList();

        return Result<List<MessageDto>>.Success(dtos);
    }
}
