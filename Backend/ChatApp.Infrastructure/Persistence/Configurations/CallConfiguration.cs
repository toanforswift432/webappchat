using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChatApp.Infrastructure.Persistence.Configurations;

public class CallConfiguration : IEntityTypeConfiguration<Call>
{
    public void Configure(EntityTypeBuilder<Call> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Type).IsRequired();
        builder.Property(c => c.Status).IsRequired();

        builder.HasOne(c => c.Conversation)
            .WithMany()
            .HasForeignKey(c => c.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Initiator)
            .WithMany()
            .HasForeignKey(c => c.InitiatorId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent cascade conflict

        builder.HasMany(c => c.Participants)
            .WithOne(p => p.Call)
            .HasForeignKey(p => p.CallId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CallParticipantConfiguration : IEntityTypeConfiguration<CallParticipant>
{
    public void Configure(EntityTypeBuilder<CallParticipant> builder)
    {
        builder.HasKey(cp => cp.Id);

        builder.Property(cp => cp.IsVideoEnabled).IsRequired();
        builder.Property(cp => cp.IsAudioEnabled).IsRequired();

        builder.HasOne(cp => cp.User)
            .WithMany()
            .HasForeignKey(cp => cp.UserId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent cascade conflict
    }
}
