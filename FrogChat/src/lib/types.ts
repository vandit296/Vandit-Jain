export type Profile = {
  id: string;
  username: string;
  avatar_seed: string;
  created_at: string;
};

export type Chatroom = {
  id: string;
  name: string;
  topic: string;
  description: string;
  emoji: string;
  created_at: string;
};

export type Message = {
  id: string;
  chatroom_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
};

export type DMConversation = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_user?: Profile;
  last_message?: DMMessage;
};

export type DMMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
};
