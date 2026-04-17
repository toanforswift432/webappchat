using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChatApp.Infrastructure.Persistence.Configurations;

public class FriendRequestConfiguration : IEntityTypeConfiguration<FriendRequest>
{
    public void Configure(EntityTypeBuilder<FriendRequest> b)
    {
        b.HasKey(r => r.Id);
        b.HasOne(r => r.FromUser).WithMany(u => u.SentFriendRequests).HasForeignKey(r => r.FromUserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(r => r.ToUser).WithMany(u => u.ReceivedFriendRequests).HasForeignKey(r => r.ToUserId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(r => new { r.FromUserId, r.ToUserId });
    }
}

public class FriendshipConfiguration : IEntityTypeConfiguration<Friendship>
{
    public void Configure(EntityTypeBuilder<Friendship> b)
    {
        b.HasKey(f => f.Id);
        b.HasOne(f => f.User).WithMany(u => u.Friendships).HasForeignKey(f => f.UserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(f => f.Friend).WithMany().HasForeignKey(f => f.FriendId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(f => new { f.UserId, f.FriendId }).IsUnique();
    }
}
