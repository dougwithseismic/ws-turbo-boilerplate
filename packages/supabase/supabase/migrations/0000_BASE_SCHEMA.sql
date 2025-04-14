-- Initial Supabase setup and extensions
SET
    statement_timeout = 0;

SET
    lock_timeout = 0;

SET
    idle_in_transaction_session_timeout = 0;

SET
    client_encoding = 'UTF8';

SET
    standard_conforming_strings = on;

SELECT
    pg_catalog.set_config('search_path', '', false);

SET
    check_function_bodies = false;

SET
    xmloption = content;

SET
    client_min_messages = warning;

SET
    row_security = off;

-- Required Extensions
COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Timestamps function
CREATE
OR REPLACE FUNCTION public .update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN
    NEW .updated_at = now();

RETURN NEW;

END;

$$ language 'plpgsql';

-- Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public .profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON
    DELETE
        CASCADE,
        updated_at timestamp with time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
        username text UNIQUE,
        full_name text,
        avatar_url text,
        -- Add any other profile-specific fields here
        CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

ALTER TABLE
    public .profiles OWNER TO postgres;

COMMENT ON TABLE public .profiles IS 'Profile data for each user.';

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE
UPDATE
    ON public .profiles FOR EACH ROW EXECUTE FUNCTION public .update_updated_at_column();

-- Allow realtime
ALTER PUBLICATION supabase_realtime
ADD
    TABLE public .profiles;

-- Organizations Table
CREATE TABLE IF NOT EXISTS public .organizations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
    name text NOT NULL CHECK (char_length(name) > 0),
    -- Add other organization details like description, logo_url etc.
    owner_id uuid REFERENCES public .profiles(id) ON
    DELETE
    SET
        NULL -- Track original creator, optional
);

ALTER TABLE
    public .organizations OWNER TO postgres;

COMMENT ON TABLE public .organizations IS 'Represents companies or teams.';

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE
UPDATE
    ON public .organizations FOR EACH ROW EXECUTE FUNCTION public .update_updated_at_column();

-- Allow realtime
ALTER PUBLICATION supabase_realtime
ADD
    TABLE public .organizations;

-- Organization Members Table (Join Table: Profiles <-> Organizations)
-- Defines roles within an organization
CREATE TABLE IF NOT EXISTS public .organization_members (
    organization_id uuid NOT NULL REFERENCES public .organizations(id) ON
    DELETE
        CASCADE,
        profile_id uuid NOT NULL REFERENCES public .profiles(id) ON
    DELETE
        CASCADE,
        role text NOT NULL DEFAULT 'member' :: text CHECK (role IN ('owner', 'admin', 'member')),
        -- Define roles as needed
        created_at timestamp with time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
        PRIMARY KEY (organization_id, profile_id)
);

ALTER TABLE
    public .organization_members OWNER TO postgres;

COMMENT ON TABLE public .organization_members IS 'Tracks user membership and roles within organizations.';

CREATE INDEX IF NOT EXISTS idx_organization_members_profile_id ON public .organization_members(profile_id);

-- Allow realtime
ALTER PUBLICATION supabase_realtime
ADD
    TABLE public .organization_members;

-- Projects Table (Belongs to an Organization)
CREATE TABLE IF NOT EXISTS public .projects (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public .organizations(id) ON
    DELETE
        CASCADE,
        created_at timestamp with time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
        name text NOT NULL CHECK (char_length(name) > 0),
        description text -- Add other project details
);

ALTER TABLE
    public .projects OWNER TO postgres;

COMMENT ON TABLE public .projects IS 'Projects belonging to an organization.';

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public .projects(organization_id);

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at BEFORE
UPDATE
    ON public .projects FOR EACH ROW EXECUTE FUNCTION public .update_updated_at_column();

-- Allow realtime
ALTER PUBLICATION supabase_realtime
ADD
    TABLE public .projects;

-- Project Members Table (Join Table: Profiles <-> Projects)
-- Defines roles within a project (could be simpler if org roles are sufficient)
CREATE TABLE IF NOT EXISTS public .project_members (
    project_id uuid NOT NULL REFERENCES public .projects(id) ON
    DELETE
        CASCADE,
        profile_id uuid NOT NULL REFERENCES public .profiles(id) ON
    DELETE
        CASCADE,
        role text NOT NULL DEFAULT 'member' :: text CHECK (role IN ('editor', 'viewer', 'member')),
        -- Define roles as needed
        created_at timestamp with time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
        PRIMARY KEY (project_id, profile_id)
);

ALTER TABLE
    public .project_members OWNER TO postgres;

COMMENT ON TABLE public .project_members IS 'Tracks user membership and roles within specific projects.';

CREATE INDEX IF NOT EXISTS idx_project_members_profile_id ON public .project_members(profile_id);

-- Allow realtime
ALTER PUBLICATION supabase_realtime
ADD
    TABLE public .project_members;

-- Function to create profile entry when a new auth.users is created
CREATE
OR REPLACE FUNCTION public .handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER -- Must run with elevated privileges to insert into public.profiles
SET
    search_path = public AS $$ BEGIN
        INSERT INTO
            public .profiles (id, full_name, avatar_url)
        VALUES
            (
                NEW .id,
                NEW .raw_user_meta_data ->> 'full_name',
                -- Changed from 'name' based on common usage
                NEW .raw_user_meta_data ->> 'avatar_url'
            );

RETURN NEW;

END;

$$;

-- Trigger the function after user creation
-- Drop trigger if exists for idempotency
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_create_profile AFTER
INSERT
    ON auth.users FOR EACH ROW EXECUTE FUNCTION public .handle_new_user();

-- Function to update profile when auth.users is updated (optional but good practice)
CREATE
OR REPLACE FUNCTION public .handle_updated_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET
    search_path = public AS $$ BEGIN
        UPDATE
            public .profiles
        SET
            full_name = COALESCE(
                NEW .raw_user_meta_data ->> 'full_name',
                profiles.full_name
            ),
            avatar_url = COALESCE(
                NEW .raw_user_meta_data ->> 'avatar_url',
                profiles.avatar_url
            )
        WHERE
            id = NEW .id;

RETURN NEW;

END;

$$;

-- Trigger the update function
-- Drop trigger if exists for idempotency
DROP TRIGGER IF EXISTS on_auth_user_updated_update_profile ON auth.users;

CREATE TRIGGER on_auth_user_updated_update_profile AFTER
UPDATE
    ON auth.users FOR EACH ROW EXECUTE FUNCTION public .handle_updated_user();

-- Grant necessary permissions for basic Supabase operation
-- Grant usage on schema to roles
GRANT USAGE ON SCHEMA public TO anon,
authenticated,
service_role;

-- Grant basic permissions on tables
GRANT
SELECT
,
INSERT
,
UPDATE
,
DELETE
    ON TABLE public .profiles TO authenticated;

GRANT
SELECT
    ON TABLE public .profiles TO anon;

-- Anon users might need to see basic profile info
GRANT ALL ON TABLE public .profiles TO service_role;

GRANT
SELECT
,
INSERT
,
UPDATE
,
DELETE
    ON TABLE public .organizations TO authenticated;

GRANT ALL ON TABLE public .organizations TO service_role;

GRANT
SELECT
,
INSERT
,
UPDATE
,
DELETE
    ON TABLE public .organization_members TO authenticated;

GRANT ALL ON TABLE public .organization_members TO service_role;

GRANT
SELECT
,
INSERT
,
UPDATE
,
DELETE
    ON TABLE public .projects TO authenticated;

GRANT ALL ON TABLE public .projects TO service_role;

GRANT
SELECT
,
INSERT
,
UPDATE
,
DELETE
    ON TABLE public .project_members TO authenticated;

GRANT ALL ON TABLE public .project_members TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public .handle_new_user() TO service_role;

-- Trigger runs as definer (postgres)
GRANT EXECUTE ON FUNCTION public .handle_updated_user() TO service_role;

-- Trigger runs as definer (postgres)
GRANT EXECUTE ON FUNCTION public .update_updated_at_column() TO anon,
authenticated,
service_role;

-- Grant permissions on sequences (if any were explicitly created)
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
-- Default privileges for future objects created by postgres/service_role
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres,
service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres,
service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres,
service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE service_role IN SCHEMA public GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE service_role IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE service_role IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- Allow authenticated role basic operations by default (can be overridden by RLS)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT
SELECT
,
INSERT
,
UPDATE
,
DELETE
    ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;

RESET ALL;