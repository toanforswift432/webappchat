using ChatApp.Domain.Entities;

namespace ChatApp.Application.Interfaces;

public interface IMessageRepository
{
    Task<Message?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Message>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default);
    Task<List<Message>> GetByConversationAsync(Guid conversationId, int page, int pageSize, CancellationToken ct = default);
    Task<List<Message>> SearchAsync(Guid conversationId, string query, CancellationToken ct = default);
    Task AddAsync(Message message, CancellationToken ct = default);
    void Update(Message message);
    void Delete(Message message);

    // Pin queries
    Task<List<Message>> GetPinnedAsync(Guid conversationId, CancellationToken ct = default);
    Task<int> CountPinnedAsync(Guid conversationId, CancellationToken ct = default);

    // Per-user soft deletion ("delete for me")
    Task<List<Guid>> GetDeletedForMeIdsAsync(Guid conversationId, Guid userId, CancellationToken ct = default);
    Task<bool> IsDeletedForUserAsync(Guid messageId, Guid userId, CancellationToken ct = default);
    Task AddDeletionForMeAsync(MessageDeletion deletion, CancellationToken ct = default);

    // Direct reaction manipulation (bypasses collection tracking)
    Task<MessageReaction?> GetReactionAsync(Guid messageId, Guid userId, string emoji, CancellationToken ct = default);
    Task AddReactionAsync(MessageReaction reaction, CancellationToken ct = default);
    void RemoveReaction(MessageReaction reaction);
}
