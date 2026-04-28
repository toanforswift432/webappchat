using ChatApp.Application.Features.Admin;
using ChatApp.Application.Features.ContractCodes;
using ChatApp.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize] // Admin authentication required
public class AdminController(IMediator mediator, IUserRepository users) : BaseController
{
    // ── Pending Accounts Management ───────────────────────────────────────────
    [HttpGet("pending-accounts")]
    public async Task<IActionResult> GetPending(CancellationToken ct)
    {
        var pending = await users.GetPendingAccountsAsync(ct);
        var dtos = pending.Select(u => new PendingAccountDto(
            u.Id,
            u.Email,
            u.DisplayName,
            u.PhoneNumber,
            (int)u.AccountType,
            u.CreatedAt,
            u.ContractCodeId,
            u.ContractCode?.Code,
            u.ContractCode?.CompanyName,
            u.RegistrationNote));
        return Ok(dtos);
    }

    [HttpPost("accounts/{userId}/approve")]
    public async Task<IActionResult> ApproveAccount(Guid userId, [FromBody] ApproveRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new ApproveAccountCommand(userId, req.Approve), ct);
        return result.IsSuccess ? Ok(new { approved = result.Value }) : BadRequest(new { error = result.Error });
    }

    // ── Employee Management ───────────────────────────────────────────────────
    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest req, CancellationToken ct)
    {
        var command = new CreateEmployeeCommand(req.Email, req.DisplayName, req.PhoneNumber, req.Department);
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }
    // ── Contract Code Management ──────────────────────────────────────────────
    [HttpGet("contract-codes")]
    public async Task<IActionResult> GetAllContractCodes(CancellationToken ct)
    {
        var result = await mediator.Send(new GetAllContractCodesQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPost("contract-codes")]
    public async Task<IActionResult> CreateContractCode([FromBody] CreateContractCodeRequest req, CancellationToken ct)
    {
        var command = new CreateContractCodeCommand(req.Code, req.CompanyName, req.Description);
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPut("contract-codes/{id}")]
    public async Task<IActionResult> UpdateContractCode(Guid id, [FromBody] UpdateContractCodeRequest req, CancellationToken ct)
    {
        var command = new UpdateContractCodeCommand(id, req.Code, req.CompanyName, req.Description, req.IsActive);
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(new { message = result.Value }) : BadRequest(new { error = result.Error });
    }

    [HttpDelete("contract-codes/{id}")]
    public async Task<IActionResult> DeleteContractCode(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteContractCodeCommand(id), ct);
        return result.IsSuccess ? Ok(new { message = result.Value }) : BadRequest(new { error = result.Error });
    }
}

// Request DTOs
public record CreateContractCodeRequest(string Code, string CompanyName, string? Description);
public record UpdateContractCodeRequest(string Code, string CompanyName, string? Description, bool IsActive);
public record ApproveRequest(bool Approve);
public record CreateEmployeeRequest(string Email, string DisplayName, string? PhoneNumber, string? Department = null);
public record PendingAccountDto(
    Guid Id,
    string Email,
    string DisplayName,
    string? PhoneNumber,
    int AccountType,
    DateTime CreatedAt,
    Guid? ContractCodeId,
    string? ContractCode,
    string? CompanyName,
    string? RegistrationNote);
