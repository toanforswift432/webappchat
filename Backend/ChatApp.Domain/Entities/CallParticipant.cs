using ChatApp.Domain.Common;

namespace ChatApp.Domain.Entities;

public class CallParticipant : BaseEntity
{
    public Guid CallId { get; private set; }
    public Guid UserId { get; private set; }
    public DateTime? JoinedAt { get; private set; }
    public DateTime? LeftAt { get; private set; }
    public bool IsVideoEnabled { get; private set; } = true;
    public bool IsAudioEnabled { get; private set; } = true;

    public Call Call { get; private set; } = default!;
    public User User { get; private set; } = default!;

    private CallParticipant() { }

    public static CallParticipant Create(Guid callId, Guid userId)
        => new()
        {
            CallId = callId,
            UserId = userId,
            JoinedAt = DateTime.UtcNow
        };

    public void Leave()
    {
        LeftAt = DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void ToggleVideo(bool enabled)
    {
        IsVideoEnabled = enabled;
        SetUpdatedAt();
    }

    public void ToggleAudio(bool enabled)
    {
        IsAudioEnabled = enabled;
        SetUpdatedAt();
    }
}
