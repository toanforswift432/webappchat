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

    // Đăng ký khách hàng — không nhập password, chờ admin duyệt
    [AllowAnonymous]
    [HttpPost("register/customer")]
    public async Task<IActionResult> RegisterCustomer([FromBody] RegisterCustomerCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    // Verify account với token + OTP (sau khi admin approve Customer)
    [AllowAnonymous]
    [HttpPost("verify-account")]
    public async Task<IActionResult> VerifyAccount([FromBody] VerifyAccountCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    // Set password sau khi verify account
    [AllowAnonymous]
    [HttpPost("set-password")]
    public async Task<IActionResult> SetPassword([FromBody] SetPasswordCommand command, CancellationToken ct)
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

// ── Public Contract Code Endpoint (for customer registration) ────────────────
[ApiController]
[Route("api/contract-codes")]
public class ContractCodeController(IMediator mediator) : BaseController
{
    [AllowAnonymous]
    [HttpGet("active")]
    public async Task<IActionResult> GetActiveContractCodes([FromQuery] int skip = 0, [FromQuery] int take = 10, CancellationToken ct = default)
    {
        var result = await mediator.Send(new ChatApp.Application.Features.ContractCodes.GetActiveContractCodesQuery(skip, take), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }
}
