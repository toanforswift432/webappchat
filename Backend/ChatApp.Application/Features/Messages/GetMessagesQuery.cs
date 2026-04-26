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

        var allMsgs = await messages.GetByConversationAsync(req.ConversationId, req.Page, req.PageSize, ct);
        var deletedIds = await messages.GetDeletedForMeIdsAsync(req.ConversationId, req.RequesterId, ct);
        var msgs = deletedIds.Count > 0 ? allMsgs.Where(m => !deletedIds.Contains(m.Id)).ToList() : allMsgs;

        // Explicitly load reply messages to avoid unreliable EF self-join ThenInclude
        var replyToIds = msgs.Where(m => m.ReplyToMessageId.HasValue)
                             .Select(m => m.ReplyToMessageId!.Value)
                             .Distinct()
                             .ToList();
        Dictionary<Guid, Message> replyMsgMap = [];
        if (replyToIds.Count > 0)
        {
            var replyMsgs = await messages.GetByIdsAsync(replyToIds, ct);
            replyMsgMap = replyMsgs.ToDictionary(m => m.Id);
        }

        var senderIds = msgs.Select(m => m.SenderId).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        var originalSenderIds = msgs.Where(m => m.OriginalSenderId.HasValue).Select(m => m.OriginalSenderId!.Value).Distinct();
        senderIds.AddRange(originalSenderIds);
        // Include reply message sender IDs so they're resolved in the same batch
        var replySenderIds = replyMsgMap.Values.Where(m => m.SenderId.HasValue).Select(m => m.SenderId!.Value).Distinct();
        senderIds.AddRange(replySenderIds);

        var senders = (await users.GetByIdsAsync(senderIds.Distinct(), ct)).ToDictionary(u => u.Id);

        var dtos = msgs.Select(m =>
        {
            User? sender = null;
            if (m.SenderId.HasValue) senders.TryGetValue(m.SenderId.Value, out sender);

            User? originalSender = null;
            if (m.OriginalSenderId.HasValue) senders.TryGetValue(m.OriginalSenderId.Value, out originalSender);

            replyMsgMap.TryGetValue(m.ReplyToMessageId ?? Guid.Empty, out var replyMsg);
            User? replyToSender = replyMsg?.SenderId.HasValue == true && senders.TryGetValue(replyMsg.SenderId!.Value, out var rts) ? rts : null;

            var reactions = m.Reactions
                .GroupBy(r => r.Emoji)
                .Select(g => new ReactionDto(g.Key, g.Select(r => r.UserId).ToList()))
                .ToList();

            return new MessageDto(
                m.Id, m.ConversationId, m.SenderId,
                sender?.DisplayName ?? "Unknown", sender?.AvatarUrl,
                m.Type, m.Content, m.FileUrl, m.FileName, m.FileSize,
                m.ReplyToMessageId, m.IsRecalled, m.IsPinned,
                reactions, m.CreatedAt)
            {
                IsForwarded = m.IsForwarded,
                ForwardedFromMessageId = m.ForwardedFromMessageId,
                OriginalSenderName = originalSender?.DisplayName,
                ReplyToSenderName = replyToSender?.DisplayName,
                ReplyToContent = replyMsg?.IsRecalled == true ? null : (replyMsg?.Content ?? replyMsg?.FileUrl),
                ReplyToType = replyMsg?.Type
            };
        }).ToList();

        return Result<List<MessageDto>>.Success(dtos);
    }
}
