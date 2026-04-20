using ChatApp.Domain.Entities;

namespace ChatApp.Application.Interfaces;

public interface IConversationRepository
{
    Task<Conversation?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Conversation?> GetDirectAsync(Guid userAId, Guid userBId, CancellationToken ct = default);
    Task<List<Conversation>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(Conversation conversation, CancellationToken ct = default);
    Task AddMemberAsync(ConversationMember member, CancellationToken ct = default);
    void RemoveMember(ConversationMember member);
    Task<ConversationMember?> GetMemberAsync(Guid conversationId, Guid userId, CancellationToken ct = default);
    Task<List<Guid>> GetMemberIdsAsync(Guid conversationId, CancellationToken ct = default);
    void Update(Conversation conversation);
}
