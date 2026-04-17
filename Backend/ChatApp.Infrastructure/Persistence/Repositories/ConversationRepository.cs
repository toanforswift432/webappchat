using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public class ConversationRepository(AppDbContext db) : IConversationRepository
{
    public Task<Conversation?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.Conversations
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Messages).ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public Task<Conversation?> GetDirectAsync(Guid userAId, Guid userBId, CancellationToken ct = default)
        => db.Conversations
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Where(c => c.Type == ConversationType.Direct
                && c.Members.Any(m => m.UserId == userAId)
                && c.Members.Any(m => m.UserId == userBId))
            .FirstOrDefaultAsync(ct);

    public Task<List<Conversation>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => db.Conversations
            .Include(c => c.Members).ThenInclude(m => m.User)
            .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1)).ThenInclude(m => m.Sender)
            .Where(c => c.Members.Any(m => m.UserId == userId))
            .OrderByDescending(c => c.Messages.Max(m => (DateTime?)m.CreatedAt) ?? c.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Conversation conversation, CancellationToken ct = default)
        => await db.Conversations.AddAsync(conversation, ct);

    public async Task AddMemberAsync(ConversationMember member, CancellationToken ct = default)
        => await db.ConversationMembers.AddAsync(member, ct);

    public void RemoveMember(ConversationMember member) => db.ConversationMembers.Remove(member);

    public Task<ConversationMember?> GetMemberAsync(Guid conversationId, Guid userId, CancellationToken ct = default)
        => db.ConversationMembers.FirstOrDefaultAsync(m => m.ConversationId == conversationId && m.UserId == userId, ct);

    public void Update(Conversation conversation) => db.Conversations.Update(conversation);
}
