-- Delete account toan.nguyen@mangoforsalon.com và tất cả dữ liệu liên quan
-- Chạy script này trong SQL Server Management Studio hoặc Azure Data Studio

BEGIN TRANSACTION;

DECLARE @UserId UNIQUEIDENTIFIER;

-- Tìm UserId
SELECT @UserId = Id FROM Users WHERE Email = 'toan.nguyen@mangoforsalon.com';

IF @UserId IS NOT NULL
BEGIN
    PRINT 'Found user: ' + CAST(@UserId AS VARCHAR(36));
    
    -- 1. Xóa MessageReactions
    DELETE FROM MessageReactions 
    WHERE UserId = @UserId;
    PRINT 'Deleted MessageReactions';
    
    -- 2. Xóa Messages sent by user
    DELETE FROM Messages 
    WHERE SenderId = @UserId;
    PRINT 'Deleted Messages';
    
    -- 3. Xóa ConversationMembers
    DELETE FROM ConversationMembers 
    WHERE UserId = @UserId;
    PRINT 'Deleted ConversationMembers';
    
    -- 4. Xóa FriendRequests (sent & received)
    DELETE FROM FriendRequests 
    WHERE FromUserId = @UserId OR ToUserId = @UserId;
    PRINT 'Deleted FriendRequests';
    
    -- 5. Xóa Friendships
    DELETE FROM Friendships 
    WHERE UserId = @UserId OR FriendId = @UserId;
    PRINT 'Deleted Friendships';
    
    -- 6. Xóa BlockedUsers
    DELETE FROM BlockedUsers 
    WHERE BlockerId = @UserId OR BlockedId = @UserId;
    PRINT 'Deleted BlockedUsers';
    
    -- 7. Xóa Notifications
    DELETE FROM Notifications 
    WHERE UserId = @UserId OR SenderId = @UserId;
    PRINT 'Deleted Notifications';
    
    -- 8. Xóa Calls
    DELETE FROM Calls 
    WHERE CallerId = @UserId OR ReceiverId = @UserId;
    PRINT 'Deleted Calls';
    
    -- 9. Xóa User
    DELETE FROM Users 
    WHERE Id = @UserId;
    PRINT 'Deleted User: toan.nguyen@mangoforsalon.com';
    
    PRINT 'Successfully deleted all data for user: toan.nguyen@mangoforsalon.com';
END
ELSE
BEGIN
    PRINT 'User not found: toan.nguyen@mangoforsalon.com';
END

-- Uncomment dòng dưới nếu muốn commit changes
-- COMMIT TRANSACTION;

-- Nếu muốn rollback (không lưu thay đổi), uncomment dòng dưới
ROLLBACK TRANSACTION;
