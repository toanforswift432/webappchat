using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public class MessageRepository(AppDbContext db) : IMessageRepository
{
    public Task<Message?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.Messages.Include(m => m.Reactions).FirstOrDefaultAsync(m => m.Id == id, ct);

    public Task<List<Message>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default)
        => db.Messages.Where(m => ids.Contains(m.Id)).ToListAsync(ct);

    public Task<List<Message>> GetByConversationAsync(Guid conversationId, int page, int pageSize, CancellationToken ct = default)
        => db.Messages
            .Where(m => m.ConversationId == conversationId)
            .Include(m => m.Sender)
            .Include(m => m.Reactions)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(ct);

    public Task<List<Message>> SearchAsync(Guid conversationId, string query, CancellationToken ct = default)
        => db.Messages
            .Where(m => m.ConversationId == conversationId && m.Content != null && m.Content.Contains(query))
            .Include(m => m.Sender)
            .Include(m => m.Reactions)
            .OrderByDescending(m => m.CreatedAt)
            .Take(50)
            .ToListAsync(ct);

    public async Task AddAsync(Message message, CancellationToken ct = default)
        => await db.Messages.AddAsync(message, ct);

    public void Update(Message message) => db.Messages.Update(message);

    public void Delete(Message message) => db.Messages.Remove(message);

    public Task<List<Message>> GetPinnedAsync(Guid conversationId, CancellationToken ct = default)
        => db.Messages
            .Where(m => m.ConversationId == conversationId && m.IsPinned)
            .Include(m => m.Sender)
            .Include(m => m.Reactions)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(ct);

    public Task<int> CountPinnedAsync(Guid conversationId, CancellationToken ct = default)
        => db.Messages.CountAsync(m => m.ConversationId == conversationId && m.IsPinned, ct);

    public Task<List<Guid>> GetDeletedForMeIdsAsync(Guid conversationId, Guid userId, CancellationToken ct = default)
        => db.MessageDeletions
            .Where(d => d.UserId == userId && db.Messages.Any(m => m.Id == d.MessageId && m.ConversationId == conversationId))
            .Select(d => d.MessageId)
            .ToListAsync(ct);

    public Task<bool> IsDeletedForUserAsync(Guid messageId, Guid userId, CancellationToken ct = default)
        => db.MessageDeletions.AnyAsync(d => d.MessageId == messageId && d.UserId == userId, ct);

    public async Task AddDeletionForMeAsync(MessageDeletion deletion, CancellationToken ct = default)
        => await db.MessageDeletions.AddAsync(deletion, ct);

    public Task<MessageReaction?> GetReactionAsync(Guid messageId, Guid userId, string emoji, CancellationToken ct = default)
        => db.MessageReactions.FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId && r.Emoji == emoji, ct);

    public async Task AddReactionAsync(MessageReaction reaction, CancellationToken ct = default)
        => await db.MessageReactions.AddAsync(reaction, ct);

    public void RemoveReaction(MessageReaction reaction)
        => db.MessageReactions.Remove(reaction);
}
