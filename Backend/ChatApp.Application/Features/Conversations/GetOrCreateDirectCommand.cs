using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Conversations;

public record GetOrCreateDirectCommand(Guid UserId, Guid OtherUserId) : IRequest<Result<ConversationDto>>;

public class GetOrCreateDirectCommandHandler(
    IConversationRepository conversations,
    IUserRepository users,
    IUnitOfWork uow)
    : IRequestHandler<GetOrCreateDirectCommand, Result<ConversationDto>>
{
    public async Task<Result<ConversationDto>> Handle(GetOrCreateDirectCommand req, CancellationToken ct)
    {
        var existing = await conversations.GetDirectAsync(req.UserId, req.OtherUserId, ct);
        if (existing is not null)
            return Result<ConversationDto>.Success(await MapAsync(existing, req.UserId, users, ct));

        var conv = Conversation.CreateDirect();
        await conversations.AddAsync(conv, ct);
        await conversations.AddMemberAsync(ConversationMember.Create(conv.Id, req.UserId), ct);
        await conversations.AddMemberAsync(ConversationMember.Create(conv.Id, req.OtherUserId), ct);
        await uow.SaveChangesAsync(ct);

        return Result<ConversationDto>.Success(await MapAsync(conv, req.UserId, users, ct));
    }

    private static async Task<ConversationDto> MapAsync(Conversation conv, Guid currentUserId, IUserRepository users, CancellationToken ct)
    {
        var memberIds = conv.Members.Select(m => m.UserId).ToList();
        if (!memberIds.Any())
            memberIds = [currentUserId];

        var memberUsers = await users.GetByIdsAsync(memberIds, ct);
        var memberDtos = memberUsers.Select(u => new ConversationMemberDto(
            u.Id, u.DisplayName, u.AvatarUrl, MemberRole.Member, u.Status)).ToList();

        var currentMember = conv.Members.FirstOrDefault(m => m.UserId == currentUserId);
        var isMuted = currentMember?.IsMuted ?? false;

        return new ConversationDto(conv.Id, conv.Name, conv.AvatarUrl, conv.Type, memberDtos, null, 0, conv.CreatedAt, isMuted);
    }
}
