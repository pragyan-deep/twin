-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types for better type safety
CREATE TYPE memory_type AS ENUM ('fact', 'diary', 'preference', 'user_input', 'system');
CREATE TYPE memory_subject AS ENUM ('self', 'user');
CREATE TYPE memory_visibility AS ENUM ('public', 'close_friends', 'private');

-- Create the memories table
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(768), -- Google Gemini text-embedding-004 dimension
    type memory_type NOT NULL,
    subject memory_subject NOT NULL DEFAULT 'self',
    user_id TEXT,
    tags TEXT[] DEFAULT '{}',
    visibility memory_visibility NOT NULL DEFAULT 'public',
    mood TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_memories_type ON memories (type);
CREATE INDEX idx_memories_subject ON memories (subject);
CREATE INDEX idx_memories_user_id ON memories (user_id);
CREATE INDEX idx_memories_visibility ON memories (visibility);
CREATE INDEX idx_memories_created_at ON memories (created_at DESC);
CREATE INDEX idx_memories_tags ON memories USING GIN (tags);
CREATE INDEX idx_memories_metadata ON memories USING GIN (metadata);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_memories_updated_at 
    BEFORE UPDATE ON memories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE memories ADD CONSTRAINT chk_content_not_empty CHECK (length(trim(content)) > 0);
ALTER TABLE memories ADD CONSTRAINT chk_user_id_when_user_subject CHECK (
    (subject = 'user' AND user_id IS NOT NULL) OR 
    (subject = 'self')
);

-- Enable Row Level Security (RLS)
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Policy for reading memories based on visibility
CREATE POLICY "Allow read access based on visibility" ON memories
    FOR SELECT
    USING (
        visibility = 'public' OR
        (visibility = 'close_friends' AND auth.role() = 'authenticated') OR
        (visibility = 'private' AND auth.uid()::text = user_id)
    );

-- Policy for inserting memories (authenticated users only)
CREATE POLICY "Allow authenticated users to insert memories" ON memories
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating own memories
CREATE POLICY "Allow users to update own memories" ON memories
    FOR UPDATE
    USING (auth.uid()::text = user_id OR subject = 'self')
    WITH CHECK (auth.uid()::text = user_id OR subject = 'self');

-- Policy for deleting own memories
CREATE POLICY "Allow users to delete own memories" ON memories
    FOR DELETE
    USING (auth.uid()::text = user_id OR subject = 'self');

-- Create a function for semantic search
CREATE OR REPLACE FUNCTION search_memories(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.8,
    match_count INT DEFAULT 10,
    filter_visibility memory_visibility DEFAULT NULL,
    filter_type memory_type DEFAULT NULL,
    filter_subject memory_subject DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    type memory_type,
    subject memory_subject,
    user_id TEXT,
    tags TEXT[],
    visibility memory_visibility,
    mood TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        m.id,
        m.content,
        m.type,
        m.subject,
        m.user_id,
        m.tags,
        m.visibility,
        m.mood,
        m.metadata,
        m.created_at,
        1 - (m.embedding <=> query_embedding) AS similarity
    FROM memories m
    WHERE 
        (m.embedding <=> query_embedding) < (1 - match_threshold)
        AND (filter_visibility IS NULL OR m.visibility = filter_visibility)
        AND (filter_type IS NULL OR m.type = filter_type)
        AND (filter_subject IS NULL OR m.subject = filter_subject)
        AND (
            m.visibility = 'public' OR
            (m.visibility = 'close_friends' AND auth.role() = 'authenticated') OR
            (m.visibility = 'private' AND auth.uid()::text = m.user_id)
        )
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Create a helper function to get memory stats
CREATE OR REPLACE FUNCTION get_memory_stats()
RETURNS TABLE (
    total_memories BIGINT,
    by_type JSONB,
    by_visibility JSONB,
    by_subject JSONB
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        COUNT(*) as total_memories,
        jsonb_object_agg(type, type_count) as by_type,
        jsonb_object_agg(visibility, visibility_count) as by_visibility,
        jsonb_object_agg(subject, subject_count) as by_subject
    FROM (
        SELECT 
            COUNT(*) as total_count,
            (SELECT jsonb_object_agg(type, count) FROM (SELECT type, COUNT(*) as count FROM memories GROUP BY type) t) as by_type,
            (SELECT jsonb_object_agg(visibility, count) FROM (SELECT visibility, COUNT(*) as count FROM memories GROUP BY visibility) v) as by_visibility,
            (SELECT jsonb_object_agg(subject, count) FROM (SELECT subject, COUNT(*) as count FROM memories GROUP BY subject) s) as by_subject
        FROM memories
    ) stats,
    (SELECT type, COUNT(*) as type_count FROM memories GROUP BY type) type_stats,
    (SELECT visibility, COUNT(*) as visibility_count FROM memories GROUP BY visibility) visibility_stats,
    (SELECT subject, COUNT(*) as subject_count FROM memories GROUP BY subject) subject_stats;
$$; 