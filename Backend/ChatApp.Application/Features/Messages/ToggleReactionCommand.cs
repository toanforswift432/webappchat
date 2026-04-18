using ChatApp.Application.Common;
using ChatApp.Application.Interfaces;
using MediatR;

namespace ChatApp.Application.Features.Messages;

public record ToggleReactionCommand(Guid MessageId, Guid UserId, string Emoji) : IRequest<Result<bool>>;

public class ToggleReactionHandler(IMessageRepository messages, IUnitOfWork uow) : IRequestHandler<ToggleReactionCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ToggleReactionCommand req, CancellationToken ct)
    {
        // Check message exists
        var message = await messages.GetByIdAsync(req.MessageId, ct);
        if (message is null) return Result<bool>.Failure("Message not found.");

        // Query reaction directly from DbSet — avoids collection-tracking issues
        var existing = await messages.GetReactionAsync(req.MessageId, req.UserId, req.Emoji, ct);

        if (existing is not null)
        {
            messages.RemoveReaction(existing);
            await uow.SaveChangesAsync(ct);
            return Result<bool>.Success(false); // removed
        }
        else
        {
            var reaction = Domain.Entities.MessageReaction.Create(req.MessageId, req.UserId, req.Emoji);
            await messages.AddReactionAsync(reaction, ct);
            await uow.SaveChangesAsync(ct);
            return Result<bool>.Success(true); // added
        }
    }
}
