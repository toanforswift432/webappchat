using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Messages;

public record SendMessageCommand(
    Guid ConversationId,
    Guid SenderId,
    MessageType Type,
    string? Content,
    string? FileUrl,
    string? FileName,
    long? FileSize,
    Guid? ReplyToMessageId
) : IRequest<Result<MessageDto>>;

public class SendMessageCommandHandler(
    IMessageRepository messages,
    IConversationRepository conversations,
    IUserRepository users,
    IUnitOfWork uow)
    : IRequestHandler<SendMessageCommand, Result<MessageDto>>
{
    public async Task<Result<MessageDto>> Handle(SendMessageCommand req, CancellationToken ct)
    {
        var member = await conversations.GetMemberAsync(req.ConversationId, req.SenderId, ct);
        if (member is null)
            return Result<MessageDto>.Failure("Not a member of this conversation.");

        Message message;
        if (req.Type == MessageType.Text)
        {
            if (string.IsNullOrWhiteSpace(req.Content))
                return Result<MessageDto>.Failure("Content is required for text messages.");
            message = Message.CreateText(req.ConversationId, req.SenderId, req.Content!, req.ReplyToMessageId);
        }
        else
        {
            if (string.IsNullOrWhiteSpace(req.FileUrl))
                return Result<MessageDto>.Failure("FileUrl is required for file/image messages.");
            message = Message.CreateFile(req.ConversationId, req.SenderId, req.FileUrl!, req.FileName!, req.FileSize ?? 0, req.Type);
        }

        await messages.AddAsync(message, ct);
        await uow.SaveChangesAsync(ct);

        var sender = await users.GetByIdAsync(req.SenderId, ct);
        var dto = MapToDto(message, sender!);
        return Result<MessageDto>.Success(dto);
    }

    private static MessageDto MapToDto(Message m, Domain.Entities.User? sender) => new(
        m.Id, m.ConversationId, m.SenderId,
        sender?.DisplayName ?? "Unknown", sender?.AvatarUrl,
        m.Type, m.Content, m.FileUrl, m.FileName, m.FileSize,
        m.ReplyToMessageId, m.IsRecalled, m.IsPinned,
        [], m.CreatedAt);
}
