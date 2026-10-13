-- ==============================================================================
-- Furni Gebeya - Stage 2 Database Schema & Security Migration
-- 20261013000000_stage2_auth.sql
-- Tables: otp_codes, profiles
-- Constraints & Row Level Security: Strict server-only access on otp_codes,
--                                   Self-read/update on profiles with role-escalation locks.
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT CHECK (role IN ('supplier', 'seller', 'buyer', 'admin')),
    city TEXT,
    bio TEXT,
    avatar_url TEXT,
    onboarding_done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view profiles (needed to see suppliers, artisans, and sellers)
CREATE POLICY "Public read profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    -- Prevent users from elevating themselves to admin via client updates
    AND (role IS NULL OR role != 'admin' OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
);

-- Trigger to prevent client role update to admin
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is changing to 'admin', verify that caller is service_role
    IF NEW.role = 'admin' AND (OLD.role IS NULL OR OLD.role != 'admin') THEN
        IF current_setting('role', true) != 'service_role' AND current_setting('request.jwt.claims', true) IS NOT NULL THEN
            RAISE EXCEPTION 'Cannot self-assign admin role.';
        END IF;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_profile_role_update ON public.profiles;
CREATE TRIGGER trg_check_profile_role_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_profile_role_update();

-- 2. OTP CODES TABLE
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT
);

-- Enable RLS on otp_codes (STRICT SERVER-ONLY ACCESS)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon and authenticated roles
REVOKE ALL ON public.otp_codes FROM anon;
REVOKE ALL ON public.otp_codes FROM authenticated;

-- Allow full access to service_role only
CREATE POLICY "Service role full access on otp_codes"
ON public.otp_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Indexes for performance & query lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON public.otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_created ON public.otp_codes(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON public.otp_codes(expires_at);
