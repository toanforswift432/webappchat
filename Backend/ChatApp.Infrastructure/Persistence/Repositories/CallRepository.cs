using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public class CallRepository(AppDbContext context) : ICallRepository
{
    public async Task<Call?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.Calls
            .Include(c => c.Initiator)
            .Include(c => c.Participants).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<List<Call>> GetByConversationIdAsync(Guid conversationId, CancellationToken ct = default)
        => await context.Calls
            .Include(c => c.Initiator)
            .Include(c => c.Participants).ThenInclude(p => p.User)
            .Where(c => c.ConversationId == conversationId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

    public async Task<Call?> GetActiveCallByConversationIdAsync(Guid conversationId, CancellationToken ct = default)
        => await context.Calls
            .Include(c => c.Initiator)
            .Include(c => c.Participants).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(c => c.ConversationId == conversationId
                && (c.Status == CallStatus.Initiated || c.Status == CallStatus.Ringing || c.Status == CallStatus.Active), ct);

    public async Task AddAsync(Call call, CancellationToken ct = default)
        => await context.Calls.AddAsync(call, ct);

    public async Task AddParticipantAsync(CallParticipant participant, CancellationToken ct = default)
        => await context.CallParticipants.AddAsync(participant, ct);

    public void Update(Call call)
        => context.Calls.Update(call);

    public void UpdateParticipant(CallParticipant participant)
        => context.CallParticipants.Update(participant);
}
