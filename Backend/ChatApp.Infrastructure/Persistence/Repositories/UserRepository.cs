using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public class UserRepository(AppDbContext db) : IUserRepository
{
    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => db.Users.FindAsync([id], ct).AsTask();

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        => db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<User?> GetByRefreshTokenAsync(string refreshToken, CancellationToken ct = default)
        => db.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken, ct);

    public Task<User?> GetByPhoneAsync(string phone, CancellationToken ct = default)
        => db.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone, ct);

    public Task<List<User>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default)
        => db.Users.Where(u => ids.Contains(u.Id)).ToListAsync(ct);

    public Task<List<User>> SearchAsync(string query, CancellationToken ct = default)
        => db.Users.Where(u => u.DisplayName.Contains(query) || u.Email.Contains(query))
                   .Take(20).ToListAsync(ct);

    public Task<List<User>> GetPendingEmployeesAsync(CancellationToken ct = default)
        => db.Users
             .Where(u => u.AccountType == AccountType.Employee && u.ApprovalStatus == ApprovalStatus.Pending && u.IsVerified)
             .OrderBy(u => u.CreatedAt)
             .ToListAsync(ct);

    public async Task AddAsync(User user, CancellationToken ct = default)
        => await db.Users.AddAsync(user, ct);

    public void Update(User user) => db.Users.Update(user);
}
