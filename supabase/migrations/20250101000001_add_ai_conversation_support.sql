-- AI Conversation System Migration
-- This migration adds tables and functions to support AI-powered conversations

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    context JSONB DEFAULT '{}' NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create conversation_messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_role ON conversation_messages(role);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations table

-- Users can create their own conversations
CREATE POLICY IF NOT EXISTS "Users can create own conversations" 
ON conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own conversations
CREATE POLICY IF NOT EXISTS "Users can view own conversations" 
ON conversations FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY IF NOT EXISTS "Users can update own conversations" 
ON conversations FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY IF NOT EXISTS "Users can delete own conversations" 
ON conversations FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for conversation_messages table

-- Users can create messages in their own conversations
CREATE POLICY IF NOT EXISTS "Users can create messages in own conversations" 
ON conversation_messages FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = conversation_messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
);

-- Users can view messages in their own conversations
CREATE POLICY IF NOT EXISTS "Users can view messages in own conversations" 
ON conversation_messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = conversation_messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
);

-- Users can update messages in their own conversations
CREATE POLICY IF NOT EXISTS "Users can update messages in own conversations" 
ON conversation_messages FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = conversation_messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = conversation_messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
);

-- Users can delete messages in their own conversations
CREATE POLICY IF NOT EXISTS "Users can delete messages in own conversations" 
ON conversation_messages FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = conversation_messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
);

-- Create function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation timestamp when messages are added
CREATE TRIGGER IF NOT EXISTS trigger_update_conversation_timestamp
    AFTER INSERT OR UPDATE ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Create function to get conversation with recent messages
CREATE OR REPLACE FUNCTION get_conversation_with_messages(conversation_uuid UUID, message_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    conversation_id UUID,
    conversation_title TEXT,
    conversation_context JSONB,
    conversation_status TEXT,
    conversation_created_at TIMESTAMP WITH TIME ZONE,
    conversation_updated_at TIMESTAMP WITH TIME ZONE,
    message_id UUID,
    message_role TEXT,
    message_content TEXT,
    message_metadata JSONB,
    message_created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.context,
        c.status,
        c.created_at,
        c.updated_at,
        cm.id,
        cm.role,
        cm.content,
        cm.metadata,
        cm.created_at
    FROM conversations c
    LEFT JOIN conversation_messages cm ON c.id = cm.conversation_id
    WHERE c.id = conversation_uuid
    AND c.user_id = auth.uid()
    ORDER BY cm.created_at DESC
    LIMIT message_limit;
END;
$$;

-- Create function to get user's recent conversations
CREATE OR REPLACE FUNCTION get_user_conversations(conversation_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    title TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    message_count BIGINT,
    last_message_content TEXT,
    last_message_role TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.status,
        c.created_at,
        c.updated_at,
        COALESCE(msg_count.count, 0) as message_count,
        last_msg.content as last_message_content,
        last_msg.role as last_message_role
    FROM conversations c
    LEFT JOIN (
        SELECT 
            conversation_id, 
            COUNT(*) as count
        FROM conversation_messages 
        GROUP BY conversation_id
    ) msg_count ON c.id = msg_count.conversation_id
    LEFT JOIN LATERAL (
        SELECT content, role
        FROM conversation_messages cm
        WHERE cm.conversation_id = c.id
        ORDER BY cm.created_at DESC
        LIMIT 1
    ) last_msg ON true
    WHERE c.user_id = auth.uid()
    ORDER BY c.updated_at DESC
    LIMIT conversation_limit;
END;
$$;

-- Create function to cleanup old conversations (can be called by a scheduled job)
CREATE OR REPLACE FUNCTION cleanup_old_conversations(days_old INTEGER DEFAULT 90)
RETURNS INTEGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM conversations 
    WHERE status = 'completed' 
    AND updated_at < (NOW() - INTERVAL '1 day' * days_old);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Add table comments for documentation
COMMENT ON TABLE conversations IS 'Stores AI conversation sessions with context and metadata';
COMMENT ON COLUMN conversations.title IS 'User-friendly title for the conversation, auto-generated from first message';
COMMENT ON COLUMN conversations.context IS 'JSON object containing conversation context, recent entities, and user preferences';
COMMENT ON COLUMN conversations.status IS 'Current status of the conversation (active, completed, paused)';

COMMENT ON TABLE conversation_messages IS 'Stores individual messages within AI conversations';
COMMENT ON COLUMN conversation_messages.role IS 'Message sender role (user, assistant, system)';
COMMENT ON COLUMN conversation_messages.content IS 'Message text content';
COMMENT ON COLUMN conversation_messages.metadata IS 'Optional JSON metadata including intent, entities, actions, confidence scores';

-- Grant necessary permissions for the functions
GRANT EXECUTE ON FUNCTION get_conversation_with_messages(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations(INTEGER) TO authenticated;

-- Note: cleanup_old_conversations should only be accessible to service role or admin
-- GRANT EXECUTE ON FUNCTION cleanup_old_conversations(INTEGER) TO service_role;