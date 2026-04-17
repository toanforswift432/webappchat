using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ChatApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    protected Guid CurrentUserId
    {
        get
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                   ?? User.FindFirstValue("sub");
            return Guid.Parse(sub!);
        }
    }
}
