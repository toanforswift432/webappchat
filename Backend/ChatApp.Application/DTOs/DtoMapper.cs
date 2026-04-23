using ChatApp.Domain.Entities;

namespace ChatApp.Application.DTOs;

public static class DtoMapper
{
    public static UserDto ToDto(this User user)
    {
        var notif = new NotificationSettingsDto(
            user.NotificationSound, user.NotificationMessages, user.NotificationGroups,
            user.NotificationMentions, user.NotificationPreview,
            user.MessageSoundType, user.CallSoundType);

        return new UserDto(
            user.Id, user.Email, user.DisplayName, user.PhoneNumber,
            user.AvatarUrl, user.Status, user.LastSeenAt,
            user.AccountType, user.ApprovalStatus, user.IsVerified, notif);
    }
}
