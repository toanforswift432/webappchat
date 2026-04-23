namespace ChatApp.Domain.Enums;

public enum MessageType
{
    Text,
    Image,
    File,
    Poll,
    Sticker,
    System
}

public enum ConversationType
{
    Direct,
    Group
}

public enum OnlineStatus
{
    Offline,
    Online,
    Away,
    InMeeting,
    WorkFromHome
}

public enum FriendRequestStatus
{
    Pending,
    Accepted,
    Rejected
}

public enum MemberRole
{
    Member,
    Admin
}

public enum CallType
{
    Audio,
    Video
}

public enum CallStatus
{
    Initiated,
    Ringing,
    Active,
    Ended,
    Missed,
    Rejected
}

public enum AccountType
{
    Customer,  // Khách hàng bên ngoài
    Employee,  // Nhân viên nội bộ
    Admin      // Quản trị hệ thống
}

public enum ApprovalStatus
{
    Pending,   // Chờ admin duyệt (chỉ áp dụng Employee)
    Approved,  // Đã duyệt
    Rejected   // Bị từ chối
}
