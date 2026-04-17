using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ChatApp.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.HasKey(u => u.Id);
        b.Property(u => u.Email).IsRequired().HasMaxLength(256);
        b.Property(u => u.PasswordHash).IsRequired();
        b.Property(u => u.DisplayName).IsRequired().HasMaxLength(100);
        b.Property(u => u.AvatarUrl).HasMaxLength(1000);
        b.Property(u => u.RefreshToken).HasMaxLength(500);
        b.HasIndex(u => u.Email).IsUnique();
        b.HasIndex(u => u.RefreshToken);
    }
}
