using ChatApp.Domain.Entities;

namespace ChatApp.Application.Interfaces;

public interface IMessageRepository
{
    Task<Message?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Message>> GetByConversationAsync(Guid conversationId, int page, int pageSize, CancellationToken ct = default);
    Task<List<Message>> SearchAsync(Guid conversationId, string query, CancellationToken ct = default);
    Task AddAsync(Message message, CancellationToken ct = default);
    void Update(Message message);
}
