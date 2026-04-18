using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Conversations;

public record MuteConversationCommand(Guid ConversationId, Guid UserId, bool Mute) : IRequest<Result<bool>>;

public class MuteConversationHandler(IConversationRepository conversations, IUnitOfWork uow) : IRequestHandler<MuteConversationCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(MuteConversationCommand req, CancellationToken ct)
    {
        var conversation = await conversations.GetByIdAsync(req.ConversationId, ct);
        if (conversation is null)
            return Result<bool>.Failure("Conversation not found.");

        var member = conversation.Members.FirstOrDefault(m => m.UserId == req.UserId);
        if (member is null)
            return Result<bool>.Failure("User is not a member of this conversation.");

        if (req.Mute)
            member.Mute();
        else
            member.Unmute();

        await uow.SaveChangesAsync(ct);
        return Result<bool>.Success(true);
    }
}
