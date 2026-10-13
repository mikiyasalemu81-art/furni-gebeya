-- ==============================================================================
-- Furni Gebeya - Stage 2 Migration
-- 20261009000001_auth_otp_and_admin_seed.sql
-- Features: OTP Verifications Table, Role Updates (supplier, seller, buyer, admin),
--           Onboarding Tracking, and Seeded Admin Account
-- ==============================================================================

-- 1. UPDATE ROLE CONSTRAINT AND ADD ONBOARDING FIELD IN PROFILES
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('buyer', 'seller', 'supplier', 'admin'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. CREATE OTP VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    phone_number TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on otp_verifications (Restricted to server-side service role only)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- No public policies; only service_role (backend API) has access
CREATE POLICY "Service role full access on otp_verifications"
ON public.otp_verifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index for expiring cleanup
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON public.otp_verifications(expires_at);

-- 3. SEED ADMIN ACCOUNT
-- Inserts a dedicated administrative user into auth.users and public.profiles
DO $$
DECLARE
    admin_uid UUID := 'a0000000-0000-0000-0000-000000000001';
BEGIN
    -- Insert admin into auth.users if not present
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_uid) THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            phone,
            phone_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            admin_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            '+251911000000',
            NOW(),
            '{"provider":"phone","providers":["phone"]}',
            '{"full_name":"Furni Gebeya Administrator","role":"admin"}',
            NOW(),
            NOW()
        );
    END IF;

    -- Upsert admin profile into public.profiles
    INSERT INTO public.profiles (
        id,
        full_name,
        phone_number,
        avatar_url,
        role,
        business_name,
        city,
        subcity,
        bio,
        is_verified,
        is_onboarded,
        created_at,
        updated_at
    ) VALUES (
        admin_uid,
        'Furni Gebeya Administrator',
        '+251911000000',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        'admin',
        'Furni Gebeya Headquarters',
        'Addis Ababa',
        'Bole',
        'Official Platform Administrator for Furni Gebeya Marketplace. Overseeing verified carpenters, showrooms, and quality listings.',
        TRUE,
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        is_verified = TRUE,
        is_onboarded = TRUE,
        phone_number = '+251911000000';
END $$;
