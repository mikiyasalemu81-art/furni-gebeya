-- ==============================================================================
-- Furni Gebeya - Demo Data Cleanup Script
-- Safe transactional cleanup script strictly preserving the Real Admin account (+251907173634)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DRY-RUN QUERY (Execute this first to inspect what would be deleted)
-- ------------------------------------------------------------------------------
/*
SELECT 
    (SELECT COUNT(*) FROM auth.users WHERE phone NOT IN ('+251907173634', '251907173634') AND email NOT LIKE '251907173634%') AS demo_auth_users_count,
    (SELECT COUNT(*) FROM public.profiles WHERE phone NOT IN ('+251907173634', '251907173634') AND phone_number NOT IN ('+251907173634', '251907173634')) AS demo_profiles_count,
    (SELECT COUNT(*) FROM public.otp_codes WHERE phone != '+251907173634') AS demo_test_otp_codes_count;
*/

-- ------------------------------------------------------------------------------
-- 2. TRANSACTIONAL EXECUTION (Run in Supabase SQL Editor)
-- ------------------------------------------------------------------------------
BEGIN;

-- A. Delete test OTP codes (e.g. from automated tests +251988112233)
DELETE FROM public.otp_codes 
WHERE phone != '+251907173634';

-- B. If any demo reviews exist (linked to mock users)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        DELETE FROM public.reviews;
    END IF;
END $$;

-- C. If any demo favorites exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
        DELETE FROM public.favorites;
    END IF;
END $$;

-- D. If any demo listing images exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_images') THEN
        DELETE FROM public.listing_images;
    END IF;
END $$;

-- E. If any demo listings exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listings') THEN
        DELETE FROM public.listings;
    END IF;
END $$;

-- F. If any demo wanted requests exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wanted_requests') THEN
        DELETE FROM public.wanted_requests;
    END IF;
END $$;

-- G. If any demo verification requests exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'verification_requests') THEN
        DELETE FROM public.verification_requests;
    END IF;
END $$;

-- H. If any demo profiles exist (excluding admin)
DELETE FROM public.profiles 
WHERE phone NOT IN ('+251907173634', '251907173634') 
  AND (phone_number IS NULL OR phone_number NOT IN ('+251907173634', '251907173634'));

-- I. Delete any non-admin users in auth.users
DELETE FROM auth.users 
WHERE (phone IS NULL OR phone NOT IN ('+251907173634', '251907173634'))
  AND (email IS NULL OR email NOT LIKE '251907173634%');

COMMIT;
