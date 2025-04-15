-- Migration: 0004_INVITATIONS.sql
-- Purpose: Add invitation system tables, functions, and RLS policies.
BEGIN
;

-- Start transaction
-- ========= Table Definition: invitations =========
CREATE TYPE public .invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

CREATE TYPE public .invitation_target_type AS ENUM ('organization', 'project');

CREATE TABLE IF NOT EXISTS public .invitations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    inviter_id uuid NOT NULL REFERENCES public .profiles(id) ON
    DELETE
        CASCADE,
        -- User who sent the invite
        invitee_email text NOT NULL CHECK (
            char_length(invitee_email) > 5
            AND invitee_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        ),
        -- Email of the invited person
        target_type public .invitation_target_type NOT NULL,
        -- 'organization' or 'project'
        target_id uuid NOT NULL,
        -- FK constraint added dynamically below
        role text NOT NULL CHECK (char_length(role) > 0),
        -- Role to be assigned upon acceptance (e.g., 'member', 'admin', 'editor')
        status public .invitation_status DEFAULT 'pending' NOT NULL,
        token text UNIQUE DEFAULT extensions.uuid_generate_v4() :: text NOT NULL,
        -- Unique token for potential link-based invites later
        expires_at timestamp with time zone,
        -- Optional expiration
        created_at timestamp with time zone DEFAULT timezone('utc' :: text, now()) NOT NULL,
        updated_at timestamp with time zone DEFAULT timezone('utc' :: text, now()) NOT NULL -- Ensure an email isn't invited to the same target multiple times if the invite is still pending
        -- Removing WHERE clause from here, will create separate partial index below
        -- CONSTRAINT unique_pending_invitation_per_target UNIQUE (invitee_email, target_type, target_id, status)
);

-- Index for efficient lookup by invitee email
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email_pending ON public .invitations(invitee_email)
WHERE
    (status = 'pending');

-- Partial unique index to prevent duplicate pending invites for the same email/target
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_invitation_per_target_idx ON public .invitations (invitee_email, target_type, target_id)
WHERE
    (status = 'pending');

-- Index for efficient lookup by inviter
CREATE INDEX IF NOT EXISTS idx_invitations_inviter_id ON public .invitations(inviter_id);

-- Index for efficient lookup by target
CREATE INDEX IF NOT EXISTS idx_invitations_target ON public .invitations(target_type, target_id);

COMMENT ON TABLE public .invitations IS 'Stores pending and processed invitations for users to join organizations or projects.';

COMMENT ON COLUMN public .invitations.inviter_id IS 'The user profile ID of the person who sent the invitation.';

COMMENT ON COLUMN public .invitations.invitee_email IS 'The email address of the person being invited.';

COMMENT ON COLUMN public .invitations.target_type IS 'The type of entity the invitation is for (organization or project).';

COMMENT ON COLUMN public .invitations.target_id IS 'The ID of the organization or project the invitation is for.';

COMMENT ON COLUMN public .invitations.role IS 'The role the invitee will receive upon accepting the invitation.';

COMMENT ON COLUMN public .invitations.status IS 'The current status of the invitation (pending, accepted, declined, expired).';

COMMENT ON COLUMN public .invitations.token IS 'A unique token associated with the invitation.';

COMMENT ON COLUMN public .invitations.expires_at IS 'Optional timestamp when the invitation expires.';

-- Trigger for updated_at timestamp
CREATE TRIGGER handle_updated_at BEFORE
UPDATE
    ON public .invitations FOR EACH ROW EXECUTE FUNCTION public .update_updated_at_column();

-- Add FK constraints after table creation (cleaner dependency management)
-- We cannot add a direct FK constraint to two different tables based on target_type directly in standard SQL.
-- We will rely on application logic and RLS to ensure target_id validity for now.
-- Advanced approach involves triggers or conditional constraints if strict FK enforcement is needed.
-- Allow realtime
ALTER PUBLICATION supabase_realtime
ADD
    TABLE public .invitations;

-- ========= Helper Functions =========
-- Function to get pending invitations for the currently authenticated user based on their email
CREATE
OR REPLACE FUNCTION public .get_pending_invitations() RETURNS SETOF public .invitations -- Returns rows matching the invitations table structure
LANGUAGE sql SECURITY DEFINER -- Needed to query auth.users reliably
SET
    search_path = public AS $$
SELECT
    inv. *
FROM
    public .invitations inv
    JOIN auth.users u ON inv.invitee_email = u.email
WHERE
    inv.status = 'pending'
    AND u.id = auth.uid() -- Match based on the logged-in user's ID
    AND (
        inv.expires_at IS NULL
        OR inv.expires_at > now()
    );

-- Ignore expired invitations
$$;

COMMENT ON FUNCTION public .get_pending_invitations() IS 'Retrieves all pending invitations for the currently authenticated user based on their verified email.';

-- Function for an authenticated user to accept an invitation
CREATE
OR REPLACE FUNCTION public .accept_invitation(invitation_id uuid) RETURNS jsonb -- Return status or the newly created membership record
LANGUAGE plpgsql SECURITY DEFINER -- To insert into potentially protected member tables
SET
    search_path = public -- Ensures we use public schema tables
    AS $$
DECLARE
    invitation_record public .invitations;

target_profile_id uuid := auth.uid();

-- Get the ID of the user calling the function
target_user_email text;

BEGIN
    -- Get the email of the calling user
    SELECT
        email INTO target_user_email
    FROM
        auth.users
    WHERE
        id = target_profile_id;

IF target_user_email IS NULL THEN RAISE
EXCEPTION
    'User not found.';

END IF;

-- Fetch the invitation and lock the row
SELECT
    * INTO invitation_record
FROM
    public .invitations
WHERE
    id = invitation_id
    AND status = 'pending' FOR
UPDATE
;

-- Lock the row to prevent race conditions
-- Validate the invitation
IF invitation_record IS NULL THEN RAISE
EXCEPTION
    'Invitation not found or not pending.';

END IF;

IF invitation_record.invitee_email <> target_user_email THEN RAISE
EXCEPTION
    'Invitation is not addressed to the current user.';

END IF;

IF invitation_record.expires_at IS NOT NULL
AND invitation_record.expires_at <= now() THEN -- Optionally update status to 'expired' here before raising
UPDATE
    public .invitations
SET
    status = 'expired',
    updated_at = now()
WHERE
    id = invitation_id;

RAISE
EXCEPTION
    'Invitation has expired.';

END IF;

-- Add user to the target based on type
IF invitation_record.target_type = 'organization' THEN -- Check if user is already a member
IF EXISTS (
    SELECT
        1
    FROM
        public .organization_members
    WHERE
        organization_id = invitation_record.target_id
        AND profile_id = target_profile_id
) THEN -- User is already member, just accept the invite status
UPDATE
    public .invitations
SET
    status = 'accepted',
    updated_at = now()
WHERE
    id = invitation_id;

RETURN jsonb_build_object(
    'status',
    'success',
    'message',
    'Already an organization member. Invitation marked accepted.'
);

ELSE -- Insert into organization members
INSERT INTO
    public .organization_members (organization_id, profile_id, role)
VALUES
    (
        invitation_record.target_id,
        target_profile_id,
        invitation_record.role
    );

END IF;

ELSIF invitation_record.target_type = 'project' THEN -- Check if user is already a member
IF EXISTS (
    SELECT
        1
    FROM
        public .project_members
    WHERE
        project_id = invitation_record.target_id
        AND profile_id = target_profile_id
) THEN -- User is already member, just accept the invite status
UPDATE
    public .invitations
SET
    status = 'accepted',
    updated_at = now()
WHERE
    id = invitation_id;

RETURN jsonb_build_object(
    'status',
    'success',
    'message',
    'Already a project member. Invitation marked accepted.'
);

ELSE -- Insert into project members
INSERT INTO
    public .project_members (project_id, profile_id, role)
VALUES
    (
        invitation_record.target_id,
        target_profile_id,
        invitation_record.role
    );

END IF;

ELSE RAISE
EXCEPTION
    'Invalid invitation target type.';

END IF;

-- Update invitation status to accepted
UPDATE
    public .invitations
SET
    status = 'accepted',
    updated_at = now()
WHERE
    id = invitation_id;

RETURN jsonb_build_object(
    'status',
    'success',
    'message',
    'Invitation accepted successfully.'
);

EXCEPTION
    WHEN others THEN -- Log error maybe?
    RAISE WARNING 'Error accepting invitation %: %',
    invitation_id,
    SQLERRM;

RETURN jsonb_build_object(
    'status',
    'error',
    'message',
    'Failed to accept invitation: ' || SQLERRM
);

END;

$$;

COMMENT ON FUNCTION public .accept_invitation(uuid) IS 'Allows the authenticated user to accept a pending invitation addressed to their email, adding them to the target organization or project.';

-- Function for an authenticated user to decline an invitation
CREATE
OR REPLACE FUNCTION public .decline_invitation(invitation_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER -- Needed to ensure user check against auth.users
SET
    search_path = public AS $$
DECLARE
    invitation_record public .invitations;

target_profile_id uuid := auth.uid();

target_user_email text;

BEGIN
    SELECT
        email INTO target_user_email
    FROM
        auth.users
    WHERE
        id = target_profile_id;

IF target_user_email IS NULL THEN RAISE
EXCEPTION
    'User not found.';

END IF;

-- Fetch the invitation and lock the row
SELECT
    * INTO invitation_record
FROM
    public .invitations
WHERE
    id = invitation_id
    AND status = 'pending' FOR
UPDATE
;

-- Validate
IF invitation_record IS NULL THEN RAISE
EXCEPTION
    'Invitation not found or not pending.';

END IF;

IF invitation_record.invitee_email <> target_user_email THEN RAISE
EXCEPTION
    'Invitation is not addressed to the current user.';

END IF;

-- Update status to declined
UPDATE
    public .invitations
SET
    status = 'declined',
    updated_at = now()
WHERE
    id = invitation_id;

RETURN jsonb_build_object(
    'status',
    'success',
    'message',
    'Invitation declined.'
);

EXCEPTION
    WHEN others THEN RAISE WARNING 'Error declining invitation %: %',
    invitation_id,
    SQLERRM;

RETURN jsonb_build_object(
    'status',
    'error',
    'message',
    'Failed to decline invitation: ' || SQLERRM
);

END;

$$;

COMMENT ON FUNCTION public .decline_invitation(uuid) IS 'Allows the authenticated user to decline a pending invitation addressed to their email.';

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public .get_pending_invitations() TO authenticated;

GRANT EXECUTE ON FUNCTION public .accept_invitation(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public .decline_invitation(uuid) TO authenticated;

-- ========= RLS Policies for invitations =========
ALTER TABLE
    public .invitations ENABLE ROW LEVEL SECURITY;

-- Clear existing policies before creating new ones (idempotency)
DROP POLICY IF EXISTS "Invitees can view their own pending invitations" ON public .invitations;

DROP POLICY IF EXISTS "Inviters can view invitations they sent" ON public .invitations;

DROP POLICY IF EXISTS "Org/Project admins/members can view invites for their target" ON public .invitations;

-- Optional/Complex
DROP POLICY IF EXISTS "Users can create invitations for orgs/projects they belong to" ON public .invitations;

DROP POLICY IF EXISTS "Inviters can delete/cancel their own pending invitations" ON public .invitations;

DROP POLICY IF EXISTS "Invitees can update status via functions (implicit)" ON public .invitations;

-- SELECT Policies
-- 1. Allow invitees to see pending invitations addressed to their email.
--    Uses the get_pending_invitations function logic implicitly via SECURITY DEFINER function call
--    Direct RLS policy approach:
CREATE POLICY "Invitees can view their own pending invitations" ON public .invitations AS PERMISSIVE FOR
SELECT
    TO authenticated USING (
        status = 'pending'
        AND invitee_email = (
            SELECT
                email
            FROM
                auth.users
            WHERE
                id = auth.uid()
        )
        AND (
            expires_at IS NULL
            OR expires_at > now()
        )
    );

-- 2. Allow inviters to see the invitations they have sent.
CREATE POLICY "Inviters can view invitations they sent" ON public .invitations AS PERMISSIVE FOR
SELECT
    TO authenticated USING (inviter_id = auth.uid());

-- 3. (Optional & Complex) Allow org/project admins/members to see invites for their targets
--    This requires checking membership of the *viewer* in the target org/project.
-- CREATE POLICY "Org/Project members can view invites for their target" ON public.invitations
-- AS PERMISSIVE FOR SELECT
-- TO authenticated
-- USING (
--   (target_type = 'organization' AND target_id IN (SELECT organization_id FROM public.organization_members WHERE profile_id = auth.uid() /* AND role = 'admin' */)) OR
--   (target_type = 'project' AND target_id IN (SELECT project_id FROM public.project_members WHERE profile_id = auth.uid() /* AND role = 'editor' */))
-- );
-- INSERT Policy
-- Allow authenticated users to create invitations IF they are a member (or admin/owner) of the target organization/project.
CREATE POLICY "Users can create invitations for orgs/projects they belong to" ON public .invitations AS PERMISSIVE FOR
INSERT
    TO authenticated WITH CHECK (
        inviter_id = auth.uid() -- Ensure inviter is the current user
        AND (
            -- Check for Organization Membership
            (
                target_type = 'organization'
                AND EXISTS (
                    SELECT
                        1
                    FROM
                        public .organization_members om
                    WHERE
                        om.organization_id = target_id
                        AND om.profile_id = auth.uid() -- Optional: Add role check here if only admins can invite
                        -- AND om.role IN ('admin', 'owner')
                )
            )
            OR -- Check for Project Membership (or Org membership if org members can invite to projects)
            (
                target_type = 'project'
                AND EXISTS (
                    -- Option 1: Check direct project membership
                    -- SELECT 1 FROM public.project_members pm WHERE pm.project_id = target_id AND pm.profile_id = auth.uid() /* AND pm.role IN ('editor') */
                    -- Option 2: Check organization membership of the project's org (more common)
                    SELECT
                        1
                    FROM
                        public .projects p
                        JOIN public .organization_members om ON p.organization_id = om.organization_id
                    WHERE
                        p.id = target_id
                        AND om.profile_id = auth.uid() -- Optional: Add role check here if only org admins/members can invite to projects
                        -- AND om.role IN ('admin', 'owner', 'member')
                )
            )
        )
    );

-- UPDATE Policy
-- Generally, updates should be handled by the `accept_invitation` and `decline_invitation` functions.
-- Direct updates are usually restricted. You could allow inviters to update `expires_at` or `role` on pending invites if needed.
-- Example: Allow inviter to update role/expiry of their *pending* invites
-- CREATE POLICY "Inviters can update their pending invitations" ON public.invitations
-- AS PERMISSIVE FOR UPDATE
-- TO authenticated
-- USING (inviter_id = auth.uid() AND status = 'pending')
-- WITH CHECK (inviter_id = auth.uid() AND status = 'pending');
-- DELETE Policy
-- Allow inviters to delete (cancel) pending invitations they sent.
CREATE POLICY "Inviters can delete/cancel their own pending invitations" ON public .invitations AS PERMISSIVE FOR
DELETE
    TO authenticated USING (
        inviter_id = auth.uid()
        AND status = 'pending'
    );

-- Grant permissions on the table
GRANT
SELECT
,
INSERT
,
DELETE
    ON TABLE public .invitations TO authenticated;

GRANT ALL ON TABLE public .invitations TO service_role;

-- Allow service role full access
-- Grant usage on types
GRANT USAGE ON TYPE public .invitation_status TO authenticated,
service_role;

GRANT USAGE ON TYPE public .invitation_target_type TO authenticated,
service_role;

COMMIT;

-- End transaction