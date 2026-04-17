using ChatApp.Domain.Common;
using ChatApp.Domain.Enums;

namespace ChatApp.Domain.Entities;

public class Call : BaseEntity
{
    public Guid ConversationId { get; private set; }
    public Guid InitiatorId { get; private set; }
    public CallType Type { get; private set; }
    public CallStatus Status { get; private set; }
    public DateTime? StartedAt { get; private set; }
    public DateTime? EndedAt { get; private set; }
    public TimeSpan? Duration { get; private set; }

    public Conversation Conversation { get; private set; } = default!;
    public User Initiator { get; private set; } = default!;
    public ICollection<CallParticipant> Participants { get; private set; } = [];

    private Call() { }

    public static Call Create(Guid conversationId, Guid initiatorId, CallType type)
        => new()
        {
            ConversationId = conversationId,
            InitiatorId = initiatorId,
            Type = type,
            Status = CallStatus.Initiated
        };

    public void Start()
    {
        Status = CallStatus.Active;
        StartedAt = DateTime.UtcNow;
        SetUpdatedAt();
    }

    public void End()
    {
        Status = CallStatus.Ended;
        EndedAt = DateTime.UtcNow;
        if (StartedAt.HasValue)
            Duration = EndedAt.Value - StartedAt.Value;
        SetUpdatedAt();
    }

    public void Reject()
    {
        Status = CallStatus.Rejected;
        SetUpdatedAt();
    }

    public void Miss()
    {
        Status = CallStatus.Missed;
        SetUpdatedAt();
    }

    public void SetRinging()
    {
        Status = CallStatus.Ringing;
        SetUpdatedAt();
    }
}
