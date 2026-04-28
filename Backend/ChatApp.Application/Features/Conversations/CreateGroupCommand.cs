using ChatApp.Application.Common;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using MediatR;

namespace ChatApp.Application.Features.Conversations;

public record CreateGroupCommand(string Name, Guid CreatedByUserId, List<Guid> MemberIds) : IRequest<Result<ConversationDto>>;

public class CreateGroupCommandHandler(
    IConversationRepository conversations,
    IUserRepository users,
    IUnitOfWork uow)
    : IRequestHandler<CreateGroupCommand, Result<ConversationDto>>
{
    public async Task<Result<ConversationDto>> Handle(CreateGroupCommand req, CancellationToken ct)
    {
        var conversation = Conversation.CreateGroup(req.Name, req.CreatedByUserId);
        await conversations.AddAsync(conversation, ct);

        var allMemberIds = req.MemberIds.Union([req.CreatedByUserId]).Distinct().ToList();
        foreach (var memberId in allMemberIds)
        {
            var role = memberId == req.CreatedByUserId ? MemberRole.Admin : MemberRole.Member;
            var member = ConversationMember.Create(conversation.Id, memberId, role);
            await conversations.AddMemberAsync(member, ct);
        }

        await uow.SaveChangesAsync(ct);

        var memberUsers = await users.GetByIdsAsync(allMemberIds, ct);
        var memberDtos = memberUsers.Select(u => new ConversationMemberDto(
            u.Id, u.DisplayName, u.AvatarUrl,
            u.Id == req.CreatedByUserId ? MemberRole.Admin : MemberRole.Member,
            u.Status)).ToList();

        var dto = new ConversationDto(conversation.Id, conversation.Name, conversation.AvatarUrl,
            conversation.Type, memberDtos, null, 0, conversation.CreatedAt, false, false, null);
        return Result<ConversationDto>.Success(dto);
    }
}
