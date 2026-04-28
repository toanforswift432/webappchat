using ChatApp.Domain.Entities;

namespace ChatApp.Application.Interfaces;

public interface IContractCodeRepository
{
    Task<ContractCode?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ContractCode?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<List<ContractCode>> GetAllAsync(CancellationToken ct = default);
    Task<List<ContractCode>> GetActiveCodesAsync(CancellationToken ct = default);
    Task AddAsync(ContractCode contractCode, CancellationToken ct = default);
    void Update(ContractCode contractCode);
    void Delete(ContractCode contractCode);
}
