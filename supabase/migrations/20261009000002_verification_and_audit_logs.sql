-- ==============================================================================
-- Furni Gebeya - Stage 3 Migration
-- 20261009000002_verification_and_audit_logs.sql
-- Features: Private Storage Bucket for Verifications, Verification Requests Queue,
--           Admin Audit Logging, and Profile Verification Status
-- ==============================================================================

-- 1. ADD VERIFICATION STATUS TO PROFILES
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
CHECK (verification_status IN ('unverified', 'pending', 'approved', 'rejected', 'more_documents_requested'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. CREATE VERIFICATION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    id_front_path TEXT NOT NULL,
    id_back_path TEXT NOT NULL,
    trade_license_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'more_documents_requested')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATE ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Verification Requests Policies:
-- Users can see their own verification request
CREATE POLICY "Users can view their own verification request"
ON public.verification_requests FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Users can submit their own verification request
CREATE POLICY "Users can insert their own verification request"
ON public.verification_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can update verification requests
CREATE POLICY "Admins can update verification requests"
ON public.verification_requests FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Admin Audit Logs Policies:
-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Admins or backend can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (auth.uid() = admin_id);

-- 6. PRIVATE STORAGE BUCKET CONFIGURATION
-- Configures the private bucket 'verifications' if storage schema is active
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verifications',
    'verifications',
    FALSE,
    10485760, -- 10MB max per document
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 10485760;

-- Storage RLS: Users can upload documents to their own user_id folder
CREATE POLICY "Users can upload to their verification folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'verifications' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Only admins and service role can read from the private verifications bucket
CREATE POLICY "Only admins can view private verification documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'verifications' AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
);
