-- AI Conversation System Migration
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and run it

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
CREATE POLICY IF NOT EXISTS "Users can create own conversations" 
ON conversations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own conversations" 
ON conversations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own conversations" 
ON conversations FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own conversations" 
ON conversations FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for conversation_messages table
CREATE POLICY IF NOT EXISTS "Users can create messages in own conversations" 
ON conversation_messages FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = conversation_messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
);

CREATE POLICY IF NOT EXISTS "Users can view messages in own conversations" 
ON conversation_messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = conversation_messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
);

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
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON conversation_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT OR UPDATE ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_messages TO authenticated;

-- Add table comments for documentation
COMMENT ON TABLE conversations IS 'Stores AI conversation sessions with context and metadata';
COMMENT ON TABLE conversation_messages IS 'Stores individual messages within AI conversations';