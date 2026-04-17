using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public class MessageRepository(AppDbContext db) : IMessageRepository
{
    public Task<Message?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.Messages.Include(m => m.Reactions).FirstOrDefaultAsync(m => m.Id == id, ct);

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
}
