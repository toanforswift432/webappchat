using ChatApp.Domain.Entities;

namespace ChatApp.Application.Interfaces;

public interface ICallRepository
{
    Task<Call?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<Call>> GetByConversationIdAsync(Guid conversationId, CancellationToken ct = default);
    Task<Call?> GetActiveCallByConversationIdAsync(Guid conversationId, CancellationToken ct = default);
    Task AddAsync(Call call, CancellationToken ct = default);
    Task AddParticipantAsync(CallParticipant participant, CancellationToken ct = default);
    void Update(Call call);
    void UpdateParticipant(CallParticipant participant);
}
