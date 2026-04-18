-- Update all existing users to have notifications enabled
UPDATE Users 
SET NotificationSound = 1,
    NotificationMessages = 1, 
    NotificationGroups = 1,
    NotificationMentions = 1,
    NotificationPreview = 1
WHERE NotificationSound = 0 OR NotificationMessages = 0;
