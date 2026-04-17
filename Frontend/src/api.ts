import {
  Conversation,
  Message,
  User,
  Account,
  FriendRequest,
  Contact,
  AppNotification } from
'./types';

const CURRENT_USER_ID = 'user-me';

let currentAccountId: string | null = null;

// Mock Users
export const users: Record<string, User> = {
  'user-1': {
    id: 'user-1',
    name: 'Alice Nguyen',
    avatar: 'https://ui-avatars.com/api/?name=Alice+Nguyen&background=random',
    isOnline: true,
    statusMessage: 'In a meeting'
  },
  'user-2': {
    id: 'user-2',
    name: 'Bob Tran',
    avatar: 'https://ui-avatars.com/api/?name=Bob+Tran&background=random',
    isOnline: false,
    statusMessage: 'Away'
  },
  'user-3': {
    id: 'user-3',
    name: 'Charlie Le',
    avatar: 'https://ui-avatars.com/api/?name=Charlie+Le&background=random',
    isOnline: true
  },
  'user-4': {
    id: 'user-4',
    name: 'Diana Pham',
    avatar: 'https://ui-avatars.com/api/?name=Diana+Pham&background=random',
    isOnline: true,
    statusMessage: 'WFH'
  },
  'user-5': {
    id: 'user-5',
    name: 'Ethan Vu',
    avatar: 'https://ui-avatars.com/api/?name=Ethan+Vu&background=random',
    isOnline: false
  },
  'user-me': {
    id: 'user-me',
    name: 'Me',
    avatar: 'https://ui-avatars.com/api/?name=Me&background=1877f3&color=fff',
    isOnline: true,
    statusMessage: 'Available'
  }
};

// Mock Accounts
export let accountsStore: Account[] = [
{
  id: 'user-me',
  email: 'me@company.com',
  password: 'password123',
  name: 'Me',
  avatar: 'https://ui-avatars.com/api/?name=Me&background=1877f3&color=fff',
  phone: '0123456789',
  bio: 'Software Engineer',
  department: 'Engineering',
  createdAt: new Date(Date.now() - 31536000000).toISOString()
},
{
  id: 'user-1',
  email: 'alice@company.com',
  password: 'password123',
  name: 'Alice Nguyen',
  avatar: 'https://ui-avatars.com/api/?name=Alice+Nguyen&background=random',
  department: 'Design',
  createdAt: new Date(Date.now() - 31536000000).toISOString()
},
{
  id: 'user-2',
  email: 'bob@company.com',
  password: 'password123',
  name: 'Bob Tran',
  avatar: 'https://ui-avatars.com/api/?name=Bob+Tran&background=random',
  department: 'Marketing',
  createdAt: new Date(Date.now() - 31536000000).toISOString()
},
{
  id: 'user-3',
  email: 'charlie@company.com',
  password: 'password123',
  name: 'Charlie Le',
  avatar: 'https://ui-avatars.com/api/?name=Charlie+Le&background=random',
  department: 'Engineering',
  createdAt: new Date(Date.now() - 31536000000).toISOString()
},
{
  id: 'user-4',
  email: 'diana@company.com',
  password: 'password123',
  name: 'Diana Pham',
  avatar: 'https://ui-avatars.com/api/?name=Diana+Pham&background=random',
  department: 'HR',
  createdAt: new Date(Date.now() - 31536000000).toISOString()
},
{
  id: 'user-5',
  email: 'ethan@company.com',
  password: 'password123',
  name: 'Ethan Vu',
  avatar: 'https://ui-avatars.com/api/?name=Ethan+Vu&background=random',
  department: 'Sales',
  createdAt: new Date(Date.now() - 31536000000).toISOString()
}];


// Mock Contacts
export let contactsStore: Record<string, Contact[]> = {
  'user-me': [
  {
    userId: 'user-1',
    addedAt: new Date(Date.now() - 8640000000).toISOString()
  },
  {
    userId: 'user-2',
    addedAt: new Date(Date.now() - 8640000000).toISOString()
  },
  {
    userId: 'user-3',
    addedAt: new Date(Date.now() - 8640000000).toISOString()
  }]

};

// Mock Friend Requests
export let friendRequestsStore: FriendRequest[] = [
{
  id: 'fr-1',
  fromUserId: 'user-4',
  toUserId: 'user-me',
  status: 'pending',
  timestamp: new Date(Date.now() - 86400000).toISOString()
},
{
  id: 'fr-2',
  fromUserId: 'user-me',
  toUserId: 'user-5',
  status: 'pending',
  timestamp: new Date(Date.now() - 43200000).toISOString()
}];


// Mock Notifications
export let notificationsStore: AppNotification[] = [
{
  id: 'notif-1',
  type: 'message',
  title: 'New message from Alice',
  body: 'Hi there! How are you?',
  timestamp: new Date(Date.now() - 3600000).toISOString(),
  isRead: false,
  relatedId: 'c1',
  fromUserId: 'user-1'
},
{
  id: 'notif-2',
  type: 'friend_request',
  title: 'New friend request',
  body: 'Diana Pham sent you a friend request',
  timestamp: new Date(Date.now() - 86400000).toISOString(),
  isRead: false,
  relatedId: 'fr-1',
  fromUserId: 'user-4'
},
{
  id: 'notif-3',
  type: 'mention',
  title: 'Mentioned in Project Alpha Team',
  body: 'Charlie Le mentioned you',
  timestamp: new Date(Date.now() - 1800000).toISOString(),
  isRead: true,
  relatedId: 'g1',
  fromUserId: 'user-3'
},
{
  id: 'notif-4',
  type: 'system',
  title: 'Welcome to Z-Chat!',
  body: 'Get started by adding some friends and joining groups.',
  timestamp: new Date(Date.now() - 172800000).toISOString(),
  isRead: true
}];


// Mock Messages Store
let messagesStore: Message[] = [
{
  id: 'm1',
  conversationId: 'c1',
  senderId: 'user-1',
  type: 'text',
  content: 'Hi there! How are you?',
  timestamp: new Date(Date.now() - 3600000).toISOString(),
  status: 'seen',
  isPinned: true,
  reactions: { '👋': ['user-me'] }
},
{
  id: 'm2',
  conversationId: 'c1',
  senderId: CURRENT_USER_ID,
  type: 'text',
  content: 'I am doing great, thanks! What about you?',
  timestamp: new Date(Date.now() - 3500000).toISOString(),
  status: 'seen',
  replyTo: {
    id: 'm1',
    content: 'Hi there! How are you?',
    senderName: 'Alice Nguyen',
    type: 'text'
  }
},
{
  id: 'm3',
  conversationId: 'c1',
  senderId: 'user-1',
  type: 'text',
  content: 'Just working on a new project.',
  timestamp: new Date(Date.now() - 3400000).toISOString(),
  status: 'seen'
},

{
  id: 'm4',
  conversationId: 'c2',
  senderId: 'user-2',
  type: 'text',
  content: 'Can you send me the report?',
  timestamp: new Date(Date.now() - 86400000).toISOString(),
  status: 'seen'
},
{
  id: 'm5',
  conversationId: 'c2',
  senderId: CURRENT_USER_ID,
  type: 'file',
  content: '#',
  fileName: 'Q3_Report.pdf',
  fileSize: '2.4 MB',
  timestamp: new Date(Date.now() - 86000000).toISOString(),
  status: 'delivered'
},

{
  id: 'm6',
  conversationId: 'c3',
  senderId: 'user-3',
  type: 'image',
  content: 'https://picsum.photos/id/237/400/300',
  timestamp: new Date(Date.now() - 500000).toISOString(),
  status: 'seen'
},
{
  id: 'm7',
  conversationId: 'c3',
  senderId: 'user-3',
  type: 'text',
  content: 'Look at this cute dog!',
  timestamp: new Date(Date.now() - 400000).toISOString(),
  status: 'seen'
},
{
  id: 'm8',
  conversationId: 'g1',
  senderId: 'user-1',
  type: 'text',
  content: 'Welcome to the project group!',
  timestamp: new Date(Date.now() - 200000).toISOString(),
  status: 'seen',
  isPinned: true,
  reactions: { '🎉': ['user-2', 'user-3', CURRENT_USER_ID] }
}];


// Mock Conversations Store
let conversationsStore: Conversation[] = [
{
  id: 'g1',
  user: users['user-1'], // fallback
  isGroup: true,
  groupName: 'Project Alpha Team',
  groupAvatar:
  'https://ui-avatars.com/api/?name=PA&background=1877f3&color=fff',
  members: [
  users['user-me'],
  users['user-1'],
  users['user-2'],
  users['user-3']],

  adminId: 'user-me',
  lastMessage: messagesStore[7],
  unreadCount: 0
},
{
  id: 'c1',
  user: users['user-1'],
  lastMessage: messagesStore[2],
  unreadCount: 0
},
{
  id: 'c2',
  user: users['user-2'],
  lastMessage: messagesStore[4],
  unreadCount: 0
},
{
  id: 'c3',
  user: users['user-3'],
  lastMessage: messagesStore[6],
  unreadCount: 2
},
{ id: 'c4', user: users['user-4'], unreadCount: 0 },
{ id: 'c5', user: users['user-5'], unreadCount: 0 }];


export const fetchUsers = async (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(
      () =>
      resolve(Object.values(users).filter((u) => u.id !== CURRENT_USER_ID)),
      200
    );
  });
};

export const createGroup = async (
name: string,
memberIds: string[])
: Promise<Conversation> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const groupMembers = [
      users[CURRENT_USER_ID],
      ...memberIds.map((id) => users[id])];

      const newGroup: Conversation = {
        id: `g${Date.now()}`,
        user: users['user-1'], // fallback
        isGroup: true,
        groupName: name,
        groupAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        members: groupMembers,
        adminId: CURRENT_USER_ID,
        unreadCount: 0
      };
      conversationsStore.unshift(newGroup);
      resolve(newGroup);
    }, 300);
  });
};

export const removeGroup = async (groupId: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      conversationsStore = conversationsStore.filter((c) => c.id !== groupId);
      messagesStore = messagesStore.filter((m) => m.conversationId !== groupId);
      resolve();
    }, 300);
  });
};

export const updateGroupMembers = async (
groupId: string,
memberIds: string[])
: Promise<Conversation> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const groupIndex = conversationsStore.findIndex((c) => c.id === groupId);
      if (groupIndex > -1) {
        const groupMembers = [
        users[CURRENT_USER_ID],
        ...memberIds.map((id) => users[id])];

        conversationsStore[groupIndex].members = groupMembers;
        resolve(conversationsStore[groupIndex]);
      } else {
        reject(new Error('Group not found'));
      }
    }, 300);
  });
};

export const togglePinMessage = async (messageId: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const msg = messagesStore.find((m) => m.id === messageId);
      if (msg) {
        msg.isPinned = !msg.isPinned;
      }
      resolve();
    }, 200);
  });
};

export const toggleReaction = async (
messageId: string,
emoji: string,
userId: string)
: Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const msg = messagesStore.find((m) => m.id === messageId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

        const userIndex = msg.reactions[emoji].indexOf(userId);
        if (userIndex > -1) {
          msg.reactions[emoji].splice(userIndex, 1);
          if (msg.reactions[emoji].length === 0) {
            delete msg.reactions[emoji];
          }
        } else {
          msg.reactions[emoji].push(userId);
        }
      }
      resolve();
    }, 200);
  });
};

export const updateUserStatus = async (status: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      users[CURRENT_USER_ID].statusMessage = status;
      resolve();
    }, 200);
  });
};

export const forwardMessage = async (
messageId: string,
targetConversationId: string)
: Promise<Message> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const originalMsg = messagesStore.find((m) => m.id === messageId);
      if (!originalMsg) return reject(new Error('Message not found'));

      const newMsg: Message = {
        ...originalMsg,
        id: `m${Date.now()}`,
        conversationId: targetConversationId,
        senderId: CURRENT_USER_ID,
        timestamp: new Date().toISOString(),
        status: 'sent',
        isPinned: false,
        isForwarded: true,
        reactions: {},
        replyTo: undefined
      };

      messagesStore.push(newMsg);

      const convIndex = conversationsStore.findIndex(
        (c) => c.id === targetConversationId
      );
      if (convIndex !== -1) {
        conversationsStore[convIndex].lastMessage = newMsg;
        const conv = conversationsStore.splice(convIndex, 1)[0];
        conversationsStore.unshift(conv);
      }

      resolve(newMsg);
    }, 300);
  });
};

export const recallMessage = async (messageId: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const msg = messagesStore.find((m) => m.id === messageId);
      if (msg && msg.senderId === CURRENT_USER_ID) {
        msg.isRecalled = true;
      }
      resolve();
    }, 200);
  });
};

export const votePoll = async (
messageId: string,
optionId: string,
userId: string)
: Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const msg = messagesStore.find((m) => m.id === messageId);
      if (msg && msg.type === 'poll' && msg.pollData) {
        // Remove user's previous vote if any
        msg.pollData.options.forEach((opt) => {
          const index = opt.votes.indexOf(userId);
          if (index > -1) opt.votes.splice(index, 1);
        });

        // Add new vote
        const option = msg.pollData.options.find((o) => o.id === optionId);
        if (option) {
          option.votes.push(userId);
        }
      }
      resolve();
    }, 200);
  });
};

export const searchMessages = async (query: string): Promise<Message[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim()) return resolve([]);
      const lowerQuery = query.toLowerCase();
      const results = messagesStore.filter(
        (m) =>
        m.type === 'text' && m.content.toLowerCase().includes(lowerQuery)
      );
      resolve(results);
    }, 300);
  });
};

export const fetchConversations = async (): Promise<Conversation[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...conversationsStore]), 300);
  });
};

export const fetchMessages = async (
conversationId: string)
: Promise<Message[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const msgs = messagesStore.filter(
        (m) => m.conversationId === conversationId
      );
      resolve(msgs);
    }, 300);
  });
};

export const sendMessage = async (
message: Omit<Message, 'id' | 'timestamp' | 'status'>)
: Promise<Message> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newMessage: Message = {
        ...message,
        id: `m${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      messagesStore.push(newMessage);

      // Update conversation last message
      const convIndex = conversationsStore.findIndex(
        (c) => c.id === message.conversationId
      );
      if (convIndex !== -1) {
        conversationsStore[convIndex].lastMessage = newMessage;
        // move to top
        const conv = conversationsStore.splice(convIndex, 1)[0];
        conversationsStore.unshift(conv);
      }

      resolve(newMessage);
    }, 200);
  });
};

export const simulateReply = async (
conversationId: string,
senderId: string)
: Promise<Message> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const reply: Message = {
        id: `m${Date.now()}`,
        conversationId,
        senderId,
        type: 'text',
        content: 'This is an automated reply.',
        timestamp: new Date().toISOString(),
        status: 'seen'
      };
      messagesStore.push(reply);

      const convIndex = conversationsStore.findIndex(
        (c) => c.id === conversationId
      );
      if (convIndex !== -1) {
        conversationsStore[convIndex].lastMessage = reply;
        const conv = conversationsStore.splice(convIndex, 1)[0];
        conversationsStore.unshift(conv);
      }

      resolve(reply);
    }, 2000);
  });
};

export const getCurrentUserId = () => currentAccountId || 'user-me';

// Auth API
export const loginAccount = async (
email: string,
password: string)
: Promise<Account> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const account = accountsStore.find(
        (a) => a.email === email && a.password === password
      );
      if (account) {
        currentAccountId = account.id;
        resolve(account);
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 500);
  });
};

export const registerAccount = async (
email: string,
password: string,
name: string)
: Promise<Account> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (accountsStore.some((a) => a.email === email)) {
        reject(new Error('Email already exists'));
        return;
      }
      const newId = `user-${Date.now()}`;
      const newAccount: Account = {
        id: newId,
        email,
        password,
        name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        createdAt: new Date().toISOString()
      };
      accountsStore.push(newAccount);
      users[newId] = {
        id: newId,
        name,
        avatar: newAccount.avatar,
        isOnline: true
      };
      currentAccountId = newId;
      resolve(newAccount);
    }, 500);
  });
};

export const logoutAccount = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentAccountId = null;
      resolve();
    }, 200);
  });
};

export const updateAccount = async (
updates: Partial<Account>)
: Promise<Account> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!currentAccountId) return reject(new Error('Not logged in'));
      const index = accountsStore.findIndex((a) => a.id === currentAccountId);
      if (index > -1) {
        accountsStore[index] = { ...accountsStore[index], ...updates };
        if (updates.name || updates.avatar) {
          users[currentAccountId] = {
            ...users[currentAccountId],
            name: updates.name || users[currentAccountId].name,
            avatar: updates.avatar || users[currentAccountId].avatar
          };
        }
        resolve(accountsStore[index]);
      } else {
        reject(new Error('Account not found'));
      }
    }, 300);
  });
};

// Contacts & Friends API
export const fetchContacts = async (): Promise<
  (Contact & {user: User;})[]> =>
{
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!currentAccountId) return resolve([]);
      const contacts = contactsStore[currentAccountId] || [];
      const enrichedContacts = contacts.map((c) => ({
        ...c,
        user: users[c.userId]
      }));
      resolve(enrichedContacts);
    }, 300);
  });
};

export const fetchFriendRequests = async (): Promise<FriendRequest[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!currentAccountId) return resolve([]);
      const requests = friendRequestsStore.filter(
        (fr) =>
        fr.fromUserId === currentAccountId ||
        fr.toUserId === currentAccountId
      );
      resolve(requests);
    }, 300);
  });
};

export const sendFriendRequest = async (
toUserId: string)
: Promise<FriendRequest> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!currentAccountId) return reject(new Error('Not logged in'));

      // Check if already friends or request exists
      const existingContact = contactsStore[currentAccountId]?.find(
        (c) => c.userId === toUserId
      );
      if (existingContact) return reject(new Error('Already friends'));

      const existingRequest = friendRequestsStore.find(
        (fr) =>
        fr.fromUserId === currentAccountId && fr.toUserId === toUserId ||
        fr.fromUserId === toUserId && fr.toUserId === currentAccountId
      );
      if (existingRequest) return reject(new Error('Request already exists'));

      const newRequest: FriendRequest = {
        id: `fr-${Date.now()}`,
        fromUserId: currentAccountId,
        toUserId,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      friendRequestsStore.push(newRequest);
      resolve(newRequest);
    }, 300);
  });
};

export const acceptFriendRequest = async (requestId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!currentAccountId) return reject(new Error('Not logged in'));

      const request = friendRequestsStore.find((fr) => fr.id === requestId);
      if (!request || request.toUserId !== currentAccountId)
      return reject(new Error('Request not found or unauthorized'));

      request.status = 'accepted';

      // Add to contacts for both
      if (!contactsStore[request.toUserId]) contactsStore[request.toUserId] = [];
      if (!contactsStore[request.fromUserId])
      contactsStore[request.fromUserId] = [];

      const now = new Date().toISOString();
      contactsStore[request.toUserId].push({
        userId: request.fromUserId,
        addedAt: now
      });
      contactsStore[request.fromUserId].push({
        userId: request.toUserId,
        addedAt: now
      });

      // Create conversation if it doesn't exist
      const existingConv = conversationsStore.find(
        (c) =>
        !c.isGroup && (
        c.user.id === request.fromUserId &&
        currentAccountId === request.toUserId ||
        c.user.id === request.toUserId &&
        currentAccountId === request.fromUserId)
      );

      if (!existingConv) {
        const newConv: Conversation = {
          id: `c${Date.now()}`,
          user: users[request.fromUserId],
          unreadCount: 0
        };
        conversationsStore.unshift(newConv);
      }

      resolve();
    }, 300);
  });
};

export const rejectFriendRequest = async (requestId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!currentAccountId) return reject(new Error('Not logged in'));
      const index = friendRequestsStore.findIndex((fr) => fr.id === requestId);
      if (index > -1) {
        friendRequestsStore[index].status = 'rejected';
        resolve();
      } else {
        reject(new Error('Request not found'));
      }
    }, 300);
  });
};

export const removeFriend = async (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!currentAccountId) return reject(new Error('Not logged in'));

      if (contactsStore[currentAccountId]) {
        contactsStore[currentAccountId] = contactsStore[
        currentAccountId].
        filter((c) => c.userId !== userId);
      }
      if (contactsStore[userId]) {
        contactsStore[userId] = contactsStore[userId].filter(
          (c) => c.userId !== currentAccountId
        );
      }
      resolve();
    }, 300);
  });
};

export const searchAllUsers = async (query: string): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim() || !currentAccountId) return resolve([]);
      const lowerQuery = query.toLowerCase();
      const results = Object.values(users).filter(
        (u) =>
        u.id !== currentAccountId &&
        u.name.toLowerCase().includes(lowerQuery)
      );
      resolve(results);
    }, 300);
  });
};

// Notifications API
export const fetchNotifications = async (): Promise<AppNotification[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real app, filter by currentAccountId. For mock, we just return all.
      resolve([...notificationsStore]);
    }, 300);
  });
};

export const markNotificationRead = async (id: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const notif = notificationsStore.find((n) => n.id === id);
      if (notif) notif.isRead = true;
      resolve();
    }, 200);
  });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      notificationsStore.forEach((n) => n.isRead = true);
      resolve();
    }, 200);
  });
};

export const clearNotifications = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      notificationsStore = [];
      resolve();
    }, 200);
  });
};

// Global Search API
export const globalSearch = async (
query: string)
: Promise<{
  users: User[];
  conversations: Conversation[];
  messages: (Message & {conversationName: string;})[];
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query.trim()) {
        return resolve({ users: [], conversations: [], messages: [] });
      }

      const lowerQuery = query.toLowerCase();

      // Search Users
      const matchedUsers = Object.values(users).
      filter(
        (u) =>
        u.id !== currentAccountId &&
        u.name.toLowerCase().includes(lowerQuery)
      ).
      slice(0, 5);

      // Search Conversations
      const matchedConvs = conversationsStore.
      filter((c) => {
        const name = c.isGroup ? c.groupName : c.user.name;
        return name?.toLowerCase().includes(lowerQuery);
      }).
      slice(0, 5);

      // Search Messages
      const matchedMsgs = messagesStore.
      filter(
        (m) =>
        m.type === 'text' && m.content.toLowerCase().includes(lowerQuery)
      ).
      map((m) => {
        const conv = conversationsStore.find((c) => c.id === m.conversationId);
        const convName = conv ?
        conv.isGroup ?
        conv.groupName :
        conv.user.name :
        'Unknown';
        return { ...m, conversationName: convName || 'Unknown' };
      }).
      slice(0, 5);

      resolve({
        users: matchedUsers,
        conversations: matchedConvs,
        messages: matchedMsgs
      });
    }, 300);
  });
};