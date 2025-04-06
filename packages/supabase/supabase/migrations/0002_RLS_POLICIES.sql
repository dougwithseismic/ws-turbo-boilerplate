-- Enable Row Level Security (RLS) for all relevant tables
ALTER TABLE
    public .profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public .organizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public .organization_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public .projects ENABLE ROW LEVEL SECURITY;

ALTER TABLE
    public .project_members ENABLE ROW LEVEL SECURITY;

-- Clear existing policies before creating new ones (idempotency)
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public .profiles;

DROP POLICY IF EXISTS "Users can update own profile" ON public .profiles;

DROP POLICY IF EXISTS "Allow authenticated users to view any profile" ON public .profiles;

-- Organizations
DROP POLICY IF EXISTS "Members can view their organizations" ON public .organizations;

DROP POLICY IF EXISTS "Members can update their organizations" ON public .organizations;

-- Consider restricting updates
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public .organizations;

DROP POLICY IF EXISTS "Organization members can manage organization" ON public .organizations;

-- Organization Members
DROP POLICY IF EXISTS "Members can view their own memberships" ON public .organization_members;

DROP POLICY IF EXISTS "Org members can view other members in the same org" ON public .organization_members;

DROP POLICY IF EXISTS "Users can leave organizations" ON public .organization_members;

DROP POLICY IF EXISTS "Org members can add/remove members (needs role check)" ON public .organization_members;

-- Projects
DROP POLICY IF EXISTS "Members can view projects in their orgs" ON public .projects;

DROP POLICY IF EXISTS "Org members can create projects" ON public .projects;

DROP POLICY IF EXISTS "Project members can update project details" ON public .projects;

DROP POLICY IF EXISTS "Project members can delete projects" ON public .projects;

DROP POLICY IF EXISTS "Org/Project members can manage projects" ON public .projects;

-- Project Members
DROP POLICY IF EXISTS "Project members can view their own project membership" ON public .project_members;

DROP POLICY IF EXISTS "Project members can view other members in the same project" ON public .project_members;

DROP POLICY IF EXISTS "Users can leave projects" ON public .project_members;

DROP POLICY IF EXISTS "Project members can add/remove members (needs role check)" ON public .project_members;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public .profiles FOR
SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public .profiles FOR
UPDATE
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow authenticated users to see basic info of other profiles (e.g., for mentions, assignees).
-- Adjust selected columns as needed for privacy.
CREATE POLICY "Allow authenticated users to view any profile" ON public .profiles FOR
SELECT
    USING (auth.role() = 'authenticated');

-- Organizations Policies
-- Allow members to see organizations they belong to.
CREATE POLICY "Members can view their organizations" ON public .organizations FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om
            WHERE
                om.organization_id = public .organizations.id
                AND om.profile_id = auth.uid()
        )
    );

-- Allow members to update organization details (e.g., name). 
-- Consider adding role checks (e.g., 'admin') for more restrictive updates.
CREATE POLICY "Organization members can manage organization" ON public .organizations FOR
UPDATE
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om
            WHERE
                om.organization_id = public .organizations.id
                AND om.profile_id = auth.uid() -- AND om.role = 'admin' -- Optional: Add role check
        )
    ) WITH CHECK (
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om
            WHERE
                om.organization_id = public .organizations.id
                AND om.profile_id = auth.uid() -- AND om.role = 'admin' -- Optional: Add role check
        )
    );

-- Allow any authenticated user to create a new organization.
CREATE POLICY "Authenticated users can create organizations" ON public .organizations FOR
INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Organization Members Policies
-- Allow users to see their own membership details.
CREATE POLICY "Members can view their own memberships" ON public .organization_members FOR
SELECT
    USING (auth.uid() = profile_id);

-- Allow members of an organization to see other members of the *same* organization.
CREATE POLICY "Org members can view other members in the same org" ON public .organization_members FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om_viewer
            WHERE
                om_viewer.organization_id = public .organization_members.organization_id
                AND om_viewer.profile_id = auth.uid()
        )
    );

-- Allow users to remove themselves (leave) from an organization.
CREATE POLICY "Users can leave organizations" ON public .organization_members FOR
DELETE
    USING (auth.uid() = profile_id);

-- Allow organization members (optionally with specific roles) to add/remove others.
-- Requires checking the *actor's* membership and role within the target organization.
-- INSERT: Check if the user performing the insert is a member (optionally admin) of the org.
CREATE POLICY "Org members can add members (needs role check)" ON public .organization_members FOR
INSERT
    WITH CHECK (
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om_actor
            WHERE
                om_actor.organization_id = public .organization_members.organization_id
                AND om_actor.profile_id = auth.uid() -- AND om_actor.role = 'admin' -- Optional: Add role check for adding members
        )
    );

-- DELETE (for removing *others*): Check if the user performing the delete is a member (optionally admin) 
-- AND ensure they are not deleting themselves (covered by "Users can leave organizations").
CREATE POLICY "Org members can remove members (needs role check)" ON public .organization_members FOR
DELETE
    USING (
        auth.uid() != profile_id
        AND -- Prevent using this policy to remove oneself
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om_actor
            WHERE
                om_actor.organization_id = public .organization_members.organization_id
                AND om_actor.profile_id = auth.uid() -- AND om_actor.role = 'admin' -- Optional: Add role check for removing members
        )
    );

-- Projects Policies
-- Allow members of an organization to view projects within that organization.
CREATE POLICY "Members can view projects in their orgs" ON public .projects FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om
            WHERE
                om.organization_id = public .projects.organization_id
                AND om.profile_id = auth.uid()
        )
    );

-- Allow members of an organization to create projects within that organization.
CREATE POLICY "Org members can create projects" ON public .projects FOR
INSERT
    WITH CHECK (
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om
            WHERE
                om.organization_id = public .projects.organization_id
                AND om.profile_id = auth.uid() -- AND om.role IN ('admin', 'member') -- Optional: Role check if needed
        )
    );

-- Allow project members (or org members) to update project details.
-- Choose one or combine based on desired permissions.
CREATE POLICY "Org/Project members can manage projects" ON public .projects FOR
UPDATE
    USING (
        -- Check if user is an org member
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om
            WHERE
                om.organization_id = public .projects.organization_id
                AND om.profile_id = auth.uid() -- AND om.role = 'admin' -- Optional: Org role check
        ) -- OR check if user is a direct project member (if project_members table grants direct access)
        OR EXISTS (
            SELECT
                1
            FROM
                public .project_members pm
            WHERE
                pm.project_id = public .projects.id
                AND pm.profile_id = auth.uid() -- AND pm.role = 'editor' -- Optional: Project role check
        )
    ) WITH CHECK (
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om
            WHERE
                om.organization_id = public .projects.organization_id
                AND om.profile_id = auth.uid() -- AND om.role = 'admin' -- Optional: Org role check
        )
        OR EXISTS (
            SELECT
                1
            FROM
                public .project_members pm
            WHERE
                pm.project_id = public .projects.id
                AND pm.profile_id = auth.uid() -- AND pm.role = 'editor' -- Optional: Project role check
        )
    );

-- Allow project members (or org members/admins) to delete projects.
CREATE POLICY "Org/Project members can delete projects" ON public .projects FOR
DELETE
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public .organization_members om
            WHERE
                om.organization_id = public .projects.organization_id
                AND om.profile_id = auth.uid() -- AND om.role = 'admin' -- Optional: Org role check
        )
        OR EXISTS (
            SELECT
                1
            FROM
                public .project_members pm
            WHERE
                pm.project_id = public .projects.id
                AND pm.profile_id = auth.uid() -- AND pm.role = 'owner' -- Optional: Project role check
        )
    );

-- Project Members Policies (similar structure to Organization Members)
-- Allow users to see their own project membership details.
CREATE POLICY "Project members can view their own project membership" ON public .project_members FOR
SELECT
    USING (auth.uid() = profile_id);

-- Allow members of a project to see other members of the *same* project.
CREATE POLICY "Project members can view other members in the same project" ON public .project_members FOR
SELECT
    USING (
        EXISTS (
            SELECT
                1
            FROM
                public .project_members pm_viewer
            WHERE
                pm_viewer.project_id = public .project_members.project_id
                AND pm_viewer.profile_id = auth.uid()
        )
    );

-- Allow users to remove themselves (leave) from a project.
CREATE POLICY "Users can leave projects" ON public .project_members FOR
DELETE
    USING (auth.uid() = profile_id);

-- Allow project members (optionally with specific roles) to add/remove others.
-- INSERT: Check if the user performing the insert is a member (optionally admin/editor) of the project.
CREATE POLICY "Project members can add members (needs role check)" ON public .project_members FOR
INSERT
    WITH CHECK (
        EXISTS (
            SELECT
                1
            FROM
                public .project_members pm_actor
            WHERE
                pm_actor.project_id = public .project_members.project_id
                AND pm_actor.profile_id = auth.uid() -- AND pm_actor.role IN ('admin', 'editor') -- Optional: Add role check for adding
        ) -- Or potentially allow Org members to add project members
        OR EXISTS (
            SELECT
                1
            FROM
                public .organizations o
                JOIN public .organization_members om_actor ON o.id = om_actor.organization_id
                JOIN public .projects p ON o.id = p.organization_id
            WHERE
                p.id = public .project_members.project_id
                AND om_actor.profile_id = auth.uid() -- AND om_actor.role = 'admin' -- Optional: Org admin role check
        )
    );

-- DELETE (for removing *others*): Check if the user performing the delete is a member (optionally admin/editor)
-- AND ensure they are not deleting themselves.
CREATE POLICY "Project members can remove members (needs role check)" ON public .project_members FOR
DELETE
    USING (
        auth.uid() != profile_id
        AND -- Prevent using this policy to remove oneself
        (
            EXISTS (
                SELECT
                    1
                FROM
                    public .project_members pm_actor
                WHERE
                    pm_actor.project_id = public .project_members.project_id
                    AND pm_actor.profile_id = auth.uid() -- AND pm_actor.role IN ('admin', 'editor') -- Optional: Add role check for removing
            ) -- Or potentially allow Org members to remove project members
            OR EXISTS (
                SELECT
                    1
                FROM
                    public .organizations o
                    JOIN public .organization_members om_actor ON o.id = om_actor.organization_id
                    JOIN public .projects p ON o.id = p.organization_id
                WHERE
                    p.id = public .project_members.project_id
                    AND om_actor.profile_id = auth.uid() -- AND om_actor.role = 'admin' -- Optional: Org admin role check
            )
        )
    );