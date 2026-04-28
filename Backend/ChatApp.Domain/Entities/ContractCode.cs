using ChatApp.Domain.Common;

namespace ChatApp.Domain.Entities;

public class ContractCode : BaseEntity
{
    public string Code { get; private set; } = default!;
    public string CompanyName { get; private set; } = default!;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;

    private ContractCode() { }

    public static ContractCode Create(string code, string companyName, string? description = null)
        => new()
        {
            Code = code,
            CompanyName = companyName,
            Description = description,
            IsActive = true,
        };

    public void Update(string code, string companyName, string? description)
    {
        Code = code;
        CompanyName = companyName;
        Description = description;
        SetUpdatedAt();
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        SetUpdatedAt();
    }
}
