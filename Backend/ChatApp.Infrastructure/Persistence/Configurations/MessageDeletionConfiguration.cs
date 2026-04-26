using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChatApp.Infrastructure.Persistence.Configurations;

public class MessageDeletionConfiguration : IEntityTypeConfiguration<MessageDeletion>
{
    public void Configure(EntityTypeBuilder<MessageDeletion> b)
    {
        b.HasKey(d => d.Id);
        b.HasIndex(d => new { d.MessageId, d.UserId }).IsUnique();
        b.HasIndex(d => new { d.UserId, d.MessageId });
    }
}
