-- ==============================================================================
-- Furni Gebeya - Stage 4 Migration
-- 20261009000003_listings_and_favorites.sql
-- Features: Listings enhancements (ask_price, new/used condition, max 4 photos),
--           Favorites schema, and Rich Ethiopian Demo Listings Seed
-- ==============================================================================

-- 1. UPDATE LISTINGS TABLE COLUMNS & CONSTRAINTS
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS price_type TEXT NOT NULL DEFAULT 'fixed'
CHECK (price_type IN ('fixed', 'ask_price'));

-- Update condition constraint to support 'new' and 'used' as specified
ALTER TABLE public.listings
DROP CONSTRAINT IF EXISTS listings_condition_check;

ALTER TABLE public.listings
ADD CONSTRAINT listings_condition_check
CHECK (condition IN ('new', 'used', 'brand_new', 'like_new', 'refurbished', 'custom_made'));

-- 2. FAVORITES TABLE (RLS Enabled)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_listing_fav UNIQUE (user_id, listing_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- 3. DEMO LISTINGS NOTE
-- Demo listings have been removed to keep the database completely clean.
-- Real listings are created organically via user submissions through the UI / API.
