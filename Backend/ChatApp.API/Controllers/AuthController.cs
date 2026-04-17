using ChatApp.Application.Features.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public class AuthController(IMediator mediator) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(new { error = result.Error });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(new { error = result.Error });
    }
}
