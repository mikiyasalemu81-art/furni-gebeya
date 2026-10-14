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

-- 3. ADMIN ACCOUNT NOTE
-- Admin account creation is dynamically seeded from ADMIN_PHONE via scripts/seed-admin.ts
-- to guarantee zero hardcoded fake credentials.
