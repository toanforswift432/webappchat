using ChatApp.Application.Interfaces;
using ChatApp.Domain.Entities;
using ChatApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Infrastructure.Persistence.Repositories;

public class ContractCodeRepository(AppDbContext context) : IContractCodeRepository
{
    public async Task<ContractCode?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await context.ContractCodes.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<ContractCode?> GetByCodeAsync(string code, CancellationToken ct = default)
        => await context.ContractCodes.FirstOrDefaultAsync(c => c.Code == code, ct);

    public async Task<List<ContractCode>> GetAllAsync(CancellationToken ct = default)
        => await context.ContractCodes.OrderBy(c => c.Code).ToListAsync(ct);

    public async Task<List<ContractCode>> GetActiveCodesAsync(CancellationToken ct = default)
        => await context.ContractCodes
            .Where(c => c.IsActive)
            .OrderBy(c => c.Code)
            .ToListAsync(ct);

    public async Task AddAsync(ContractCode contractCode, CancellationToken ct = default)
        => await context.ContractCodes.AddAsync(contractCode, ct);

    public void Update(ContractCode contractCode)
        => context.ContractCodes.Update(contractCode);

    public void Delete(ContractCode contractCode)
        => context.ContractCodes.Remove(contractCode);
}
