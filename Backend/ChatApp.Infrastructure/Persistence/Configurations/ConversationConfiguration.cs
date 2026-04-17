using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChatApp.Infrastructure.Persistence.Configurations;

public class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> b)
    {
        b.HasKey(c => c.Id);
        b.Property(c => c.Name).HasMaxLength(100);
        b.Property(c => c.AvatarUrl).HasMaxLength(1000);
        b.HasMany(c => c.Members).WithOne(m => m.Conversation).HasForeignKey(m => m.ConversationId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(c => c.Messages).WithOne(m => m.Conversation).HasForeignKey(m => m.ConversationId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ConversationMemberConfiguration : IEntityTypeConfiguration<ConversationMember>
{
    public void Configure(EntityTypeBuilder<ConversationMember> b)
    {
        b.HasKey(m => m.Id);
        b.HasIndex(m => new { m.ConversationId, m.UserId }).IsUnique();
        b.HasOne(m => m.User).WithMany(u => u.ConversationMembers).HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
