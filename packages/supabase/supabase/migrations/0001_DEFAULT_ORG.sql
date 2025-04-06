-- Function to create a default 'Personal' organization for a new user
CREATE
OR REPLACE FUNCTION public .create_default_organization() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    new_org_id uuid;

BEGIN
    -- Create the 'Personal' organization
    INSERT INTO
        public .organizations (name)
    VALUES
        ('Personal') RETURNING id INTO new_org_id;

-- Add the new user as the owner (or admin) of this organization
INSERT INTO
    public .organization_members (organization_id, profile_id, role)
VALUES
    (new_org_id, NEW .id, 'owner');

-- Assuming 'owner' role exists or using 'admin'
RAISE LOG 'Created Personal organization % and added user % as owner',
new_org_id,
NEW .id;

RETURN NEW;

EXCEPTION
    WHEN others THEN RAISE WARNING 'Error in create_default_organization trigger for user %: % ',
    NEW .id,
    SQLERRM;

RETURN NEW;

-- Don't block profile creation due to default org error
END;

$$;

-- Trigger to call the function after a new profile is created
-- Drop the trigger if it already exists to make the script idempotent
DROP TRIGGER IF EXISTS on_profile_created_create_default_org ON public .profiles;

CREATE TRIGGER on_profile_created_create_default_org AFTER
INSERT
    ON public .profiles FOR EACH ROW EXECUTE FUNCTION public .create_default_organization();

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION public .create_default_organization() TO authenticated;

GRANT EXECUTE ON FUNCTION public .create_default_organization() TO service_role;