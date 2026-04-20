using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.API.Controllers;

public class TurnController(IConfiguration config, IHttpClientFactory httpClientFactory) : BaseController
{
    [HttpGet("credentials")]
    public async Task<IActionResult> GetCredentials()
    {
        var domain = config["Turn:MeteredDomain"];
        var apiKey = config["Turn:MeteredApiKey"];

        if (string.IsNullOrEmpty(domain) || string.IsNullOrEmpty(apiKey))
            return Ok(new { iceServers = Array.Empty<object>() });

        try
        {
            var http = httpClientFactory.CreateClient();
            var url = $"https://{domain}/api/v1/turn/credentials?apiKey={apiKey}";
            var response = await http.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return Ok(new { iceServers = Array.Empty<object>() });

            var json = await response.Content.ReadAsStringAsync();
            var iceServers = JsonSerializer.Deserialize<JsonElement>(json);
            return Ok(new { iceServers });
        }
        catch
        {
            return Ok(new { iceServers = Array.Empty<object>() });
        }
    }
}
