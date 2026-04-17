using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChatApp.Infrastructure.Persistence.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> b)
    {
        b.HasKey(m => m.Id);
        b.Property(m => m.Content).HasMaxLength(4000);
        b.Property(m => m.FileUrl).HasMaxLength(1000);
        b.Property(m => m.FileName).HasMaxLength(255);
        b.HasOne(m => m.Sender).WithMany(u => u.SentMessages).HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(m => m.ReplyToMessage).WithMany().HasForeignKey(m => m.ReplyToMessageId).OnDelete(DeleteBehavior.NoAction);
        b.HasMany(m => m.Reactions).WithOne(r => r.Message).HasForeignKey(r => r.MessageId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(m => m.ConversationId);
        b.HasIndex(m => m.CreatedAt);
    }
}

public class MessageReactionConfiguration : IEntityTypeConfiguration<MessageReaction>
{
    public void Configure(EntityTypeBuilder<MessageReaction> b)
    {
        b.HasKey(r => r.Id);
        b.HasIndex(r => new { r.MessageId, r.UserId, r.Emoji }).IsUnique();
        b.Property(r => r.Emoji).HasMaxLength(10);
        b.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
