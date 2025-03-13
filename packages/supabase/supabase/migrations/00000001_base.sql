-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    bio TEXT,
    location TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc' :: text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc' :: text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- Enable Row Level Security
ALTER TABLE
    public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR
SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR
INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles FOR
UPDATE
    USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime
ADD
    TABLE public.profiles;