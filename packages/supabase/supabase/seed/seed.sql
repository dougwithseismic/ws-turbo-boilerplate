-- Seed data for ws-turbo-boilerplate
-- Clear existing data (optional, good for repeatable seeds)
-- Use TRUNCATE with CASCADE if foreign keys cause issues, but be careful!
-- TRUNCATE TABLE public.invitations, public.project_members, public.projects, public.organization_members, public.organizations, public.profiles RESTART IDENTITY CASCADE;
-- Deleting avoids needing CASCADE but might be slower on large datasets
DELETE FROM
    public .invitations;

DELETE FROM
    public .project_members;

DELETE FROM
    public .projects;

DELETE FROM
    public .organization_members;

DELETE FROM
    public .organizations
WHERE
    name <> 'Personal';

-- Keep default Personal orgs if created by trigger
-- Be cautious deleting profiles if they are linked to auth.users you want to keep.
-- DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users); -- Example: Keep profiles linked to existing auth users
-- Seed Authentication Users (Use with caution - Bypasses standard auth logic)
-- Requires pgcrypto extension for crypt()
-- User 1 (Owner)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT
            1
        FROM
            auth.users
        WHERE
            id = '00000000-0000-0000-0000-000000000001'
    ) THEN
    INSERT INTO
        auth.users (
            id,
            email,
            encrypted_password,
            role,
            instance_id,
            aud,
            email_confirmed_at
        )
    VALUES
        (
            '00000000-0000-0000-0000-000000000001',
            'owner@example.com',
            crypt('password123', gen_salt('bf')),
            'authenticated',
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            now()
        );

-- Create corresponding identity
INSERT INTO
    auth.identities (
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        id
    )
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'owner@example.com',
        '{"sub": "00000000-0000-0000-0000-000000000001", "email": "owner@example.com"}',
        'email',
        now(),
        gen_random_uuid()
    );

END IF;

END $$;

-- User 2 (Admin)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT
            1
        FROM
            auth.users
        WHERE
            id = '00000000-0000-0000-0000-000000000002'
    ) THEN
    INSERT INTO
        auth.users (
            id,
            email,
            encrypted_password,
            role,
            instance_id,
            aud,
            email_confirmed_at
        )
    VALUES
        (
            '00000000-0000-0000-0000-000000000002',
            'admin@example.com',
            crypt('password123', gen_salt('bf')),
            'authenticated',
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            now()
        );

-- Create corresponding identity
INSERT INTO
    auth.identities (
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        id
    )
VALUES
    (
        '00000000-0000-0000-0000-000000000002',
        'admin@example.com',
        '{"sub": "00000000-0000-0000-0000-000000000002", "email": "admin@example.com"}',
        'email',
        now(),
        gen_random_uuid()
    );

END IF;

END $$;

-- User 3 (Member)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT
            1
        FROM
            auth.users
        WHERE
            id = '00000000-0000-0000-0000-000000000003'
    ) THEN
    INSERT INTO
        auth.users (
            id,
            email,
            encrypted_password,
            role,
            instance_id,
            aud,
            email_confirmed_at
        )
    VALUES
        (
            '00000000-0000-0000-0000-000000000003',
            'member@example.com',
            crypt('password123', gen_salt('bf')),
            'authenticated',
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            now()
        );

-- Create corresponding identity
INSERT INTO
    auth.identities (
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        id
    )
VALUES
    (
        '00000000-0000-0000-0000-000000000003',
        'member@example.com',
        '{"sub": "00000000-0000-0000-0000-000000000003", "email": "member@example.com"}',
        'email',
        now(),
        gen_random_uuid()
    );

END IF;

END $$;

-- Define some UUIDs for consistent seeding
-- NOTE: These MUST match actual auth.users UUIDs created in your local dev environment
-- for the seed data to be fully functional with RLS.
-- User 1 (Org Owner)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT
            1
        FROM
            public .profiles
        WHERE
            id = '00000000-0000-0000-0000-000000000001'
    ) THEN
    INSERT INTO
        public .profiles (id, username, full_name, avatar_url)
    VALUES
        (
            '00000000-0000-0000-0000-000000000001',
            'owner_user',
            'Owner User',
            'https://example.com/avatar1.png'
        );

END IF;

END $$;

-- User 2 (Admin/Member)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT
            1
        FROM
            public .profiles
        WHERE
            id = '00000000-0000-0000-0000-000000000002'
    ) THEN
    INSERT INTO
        public .profiles (id, username, full_name, avatar_url)
    VALUES
        (
            '00000000-0000-0000-0000-000000000002',
            'admin_user',
            'Admin User',
            'https://example.com/avatar2.png'
        );

END IF;

END $$;

-- User 3 (Member)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT
            1
        FROM
            public .profiles
        WHERE
            id = '00000000-0000-0000-0000-000000000003'
    ) THEN
    INSERT INTO
        public .profiles (id, username, full_name, avatar_url)
    VALUES
        (
            '00000000-0000-0000-0000-000000000003',
            'member_user',
            'Member User',
            'https://example.com/avatar3.png'
        );

END IF;

END $$;

-- Create a main Organization
INSERT INTO
    public .organizations (id, name, owner_id)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Seed Company',
        '00000000-0000-0000-0000-000000000001'
    ) ON CONFLICT (id) DO NOTHING;

-- Add Members to the Organization
INSERT INTO
    public .organization_members (organization_id, profile_id, role)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000001',
        'owner'
    ),
    -- User 1 is Owner
    (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000002',
        'admin'
    ),
    -- User 2 is Admin
    (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000003',
        'member'
    ) -- User 3 is Member
    ON CONFLICT (organization_id, profile_id) DO NOTHING;

-- Create Projects within the Organization
INSERT INTO
    public .projects (id, organization_id, name, description)
VALUES
    (
        '22222222-2222-2222-2222-222222222221',
        '11111111-1111-1111-1111-111111111111',
        'Project Alpha',
        'The first seeded project.'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'Project Beta',
        'The second seeded project, focusing on UI.'
    ) ON CONFLICT (id) DO NOTHING;

-- Add Members to Projects
INSERT INTO
    public .project_members (project_id, profile_id, role)
VALUES
    -- Project Alpha Members
    (
        '22222222-2222-2222-2222-222222222221',
        '00000000-0000-0000-0000-000000000001',
        'editor'
    ),
    -- User 1 (Org Owner) is Editor
    (
        '22222222-2222-2222-2222-222222222221',
        '00000000-0000-0000-0000-000000000002',
        'editor'
    ),
    -- User 2 (Org Admin) is Editor
    (
        '22222222-2222-2222-2222-222222222221',
        '00000000-0000-0000-0000-000000000003',
        'viewer'
    ),
    -- User 3 (Org Member) is Viewer
    -- Project Beta Members
    (
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000002',
        'editor'
    ),
    -- User 2 (Org Admin) is Editor
    (
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000003',
        'member'
    ) -- User 3 (Org Member) is Member (using 'member' role from schema)
    ON CONFLICT (project_id, profile_id) DO NOTHING;

-- Add Invitations
INSERT INTO
    public .invitations (
        inviter_id,
        invitee_email,
        target_type,
        target_id,
        role,
        status,
        expires_at
    )
VALUES
    -- Invite to Organization
    (
        '00000000-0000-0000-0000-000000000001',
        -- Invited by User 1 (Owner)
        'pending.org.member@example.com',
        -- Email to invite
        'organization',
        -- Target type
        '11111111-1111-1111-1111-111111111111',
        -- Target Org ID
        'member',
        -- Role to assign
        'pending',
        -- Status
        now() + interval '7 days' -- Expires in 7 days
    ),
    -- Invite to Project Alpha
    (
        '00000000-0000-0000-0000-000000000002',
        -- Invited by User 2 (Admin)
        'pending.project.viewer@example.com',
        -- Email to invite
        'project',
        -- Target type
        '22222222-2222-2222-2222-222222222221',
        -- Target Project Alpha ID
        'viewer',
        -- Role to assign
        'pending',
        -- Status
        NULL -- No explicit expiry
    ),
    -- Invite to Project Beta (Already Accepted - example)
    (
        '00000000-0000-0000-0000-000000000002',
        -- Invited by User 2 (Admin)
        'accepted.user@example.com',
        -- Email (imagine this user exists and accepted)
        'project',
        -- Target type
        '22222222-2222-2222-2222-222222222222',
        -- Target Project Beta ID
        'editor',
        -- Role assigned
        'accepted',
        -- Status
        NULL
    ),
    -- Invite to Organization (Expired - example)
    (
        '00000000-0000-0000-0000-000000000001',
        -- Invited by User 1 (Owner)
        'expired.user@example.com',
        -- Email to invite
        'organization',
        -- Target type
        '11111111-1111-1111-1111-111111111111',
        -- Target Org ID
        'member',
        -- Role to assign
        'expired',
        -- Status (can also be set by check on expires_at)
        now() - interval '1 day' -- Expired yesterday
    ) -- Specify only the columns covered by the unique partial index
    ON CONFLICT (invitee_email, target_type, target_id)
WHERE
    (status = 'pending') DO NOTHING;

-- Add more seed data as needed...