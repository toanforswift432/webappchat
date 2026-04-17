using ChatApp.Domain.Enums;

namespace ChatApp.Application.DTOs;

public record FriendRequestDto(
    Guid Id,
    UserDto FromUser,
    DateTime CreatedAt
);
