using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Messages;

public record PinMessageCommand(Guid MessageId, Guid ConversationId, Guid RequesterId) : IRequest<Result<bool>>;

public class PinMessageCommandHandler(
    IMessageRepository messages,
    IConversationRepository convRepo,
    IUnitOfWork uow)
    : IRequestHandler<PinMessageCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(PinMessageCommand request, CancellationToken ct)
    {
        var member = await convRepo.GetMemberAsync(request.ConversationId, request.RequesterId, ct);
        if (member is null) return Result<bool>.Failure("Not a member of this conversation");

        var message = await messages.GetByIdAsync(request.MessageId, ct);
        if (message is null || message.ConversationId != request.ConversationId)
            return Result<bool>.Failure("Message not found");

        if (!message.IsPinned)
        {
            var pinCount = await messages.CountPinnedAsync(request.ConversationId, ct);
            if (pinCount >= 3)
                return Result<bool>.Failure("Chỉ có thể ghim tối đa 3 tin nhắn");
        }

        message.TogglePin();
        messages.Update(message);
        await uow.SaveChangesAsync(ct);

        return Result<bool>.Success(message.IsPinned);
    }
}
