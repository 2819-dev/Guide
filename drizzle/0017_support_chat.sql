-- Live chat support (Guide Assistant + Guide team). Created at runtime by
-- ensureSupportChatSchema() in src/lib/support-chat.ts; kept here for the record.
CREATE TABLE IF NOT EXISTS support_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_token varchar(64) NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  visitor_name varchar(120),
  visitor_role varchar(32),
  contact_email varchar(200),
  page varchar(300),
  status varchar(16) NOT NULL DEFAULT 'ai',
  agent_name varchar(120),
  handoff_reason varchar(500),
  ai_replies integer NOT NULL DEFAULT 0,
  agent_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_chats_status_idx ON support_chats (status, last_message_at DESC);
CREATE TABLE IF NOT EXISTS support_chat_messages (
  id bigserial PRIMARY KEY,
  chat_id uuid NOT NULL REFERENCES support_chats(id) ON DELETE CASCADE,
  sender varchar(16) NOT NULL,
  author_name varchar(120),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_chat_messages_chat_idx ON support_chat_messages (chat_id, id);
CREATE TABLE IF NOT EXISTS support_chat_settings (
  id integer PRIMARY KEY DEFAULT 1,
  ai_enabled boolean NOT NULL DEFAULT true,
  greeting text,
  knowledge text,
  notify_emails text,
  offline_message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
