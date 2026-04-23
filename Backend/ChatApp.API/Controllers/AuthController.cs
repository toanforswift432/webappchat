using ChatApp.Application.Features.Auth;
using ChatApp.Application.Features.Admin;
using ChatApp.Application.DTOs;
using ChatApp.Application.Interfaces;
using ChatApp.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace ChatApp.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IMediator mediator, IConfiguration config) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(new { error = result.Error });
    }

    // Đăng ký khách hàng — không cần invite code
    [AllowAnonymous]
    [HttpPost("register/customer")]
    public async Task<IActionResult> RegisterCustomer([FromBody] RegisterCustomerCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    // Đăng ký nhân viên — route có invite code, validated tại đây
    [AllowAnonymous]
    [HttpPost("register/employee/{inviteCode}")]
    public async Task<IActionResult> RegisterEmployee(string inviteCode, [FromBody] RegisterEmployeeRequest req, CancellationToken ct)
    {
        var validCode = config["Auth:EmployeeInviteCode"];
        if (string.IsNullOrEmpty(validCode) || inviteCode != validCode)
            return BadRequest(new { error = "Invalid invite code." });

        var command = new RegisterEmployeeCommand(req.Email, req.Password, req.DisplayName, req.PhoneNumber);
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    // Xác thực OTP sau khi đăng ký
    [AllowAnonymous]
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    // Resend OTP cho tài khoản chưa verify
    [AllowAnonymous]
    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(new { error = result.Error });
    }
}

public record RegisterEmployeeRequest(string Email, string Password, string DisplayName, string PhoneNumber);

// ── Admin controller ──────────────────────────────────────────────────────────
[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController(IMediator mediator, IUserRepository users) : BaseController
{
    private void EnsureAdmin()
    {
        // Middleware sẽ enforce, đây chỉ là guard thêm
    }

    // Danh sách nhân viên chờ duyệt
    [HttpGet("pending-accounts")]
    public async Task<IActionResult> GetPending(CancellationToken ct)
    {
        var pending = await users.GetPendingEmployeesAsync(ct);
        var dtos = pending.Select(u => new PendingEmployeeDto(
            u.Id, u.Email, u.DisplayName, u.PhoneNumber, u.CreatedAt));
        return Ok(dtos);
    }

    // Duyệt hoặc từ chối tài khoản nhân viên
    [HttpPost("accounts/{userId}/approve")]
    public async Task<IActionResult> ApproveAccount(Guid userId, [FromBody] ApproveRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new ApproveAccountCommand(userId, req.Approve), ct);
        return result.IsSuccess ? Ok(new { approved = result.Value }) : BadRequest(new { error = result.Error });
    }
}

public record ApproveRequest(bool Approve);
