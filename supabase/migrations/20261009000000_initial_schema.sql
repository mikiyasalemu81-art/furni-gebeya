-- ==============================================================================
-- Furni Gebeya - Ethiopian Furniture Marketplace Database Schema
-- Migration: 20261009000000_initial_schema.sql
-- Features: Full Relational Model, Row Level Security (RLS), Triggers & Seed Data
-- ==============================================================================

-- 1. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. PROFILES TABLE (Linked with Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'artisan', 'admin')),
    business_name TEXT,
    city TEXT NOT NULL DEFAULT 'Addis Ababa',
    subcity TEXT, -- Bole, Kirkos, Yeka, Nifas Silk, Arada, etc.
    bio TEXT,
    telegram_handle TEXT,
    whatsapp_number TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. CATEGORIES TABLE (Multi-language support: EN, AM, OM)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_am TEXT NOT NULL,
    name_om TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. LISTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'ETB',
    is_negotiable BOOLEAN NOT NULL DEFAULT TRUE,
    condition TEXT NOT NULL CHECK (condition IN ('brand_new', 'like_new', 'used', 'refurbished', 'custom_made')),
    wood_type TEXT,       -- Wanza, Tid, Zigba, Kerero, MDF, Mahogany, etc.
    material TEXT,        -- Solid Wood, Leather, Fabric, Metal
    dimensions TEXT,      -- e.g. "200x180x90 cm"
    color TEXT,
    city TEXT NOT NULL DEFAULT 'Addis Ababa',
    subcity TEXT,
    specific_location TEXT, -- e.g. "Merkato, Berbere Ber", "Piassa", "Shola"
    delivery_available BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'pending_review', 'reserved', 'sold', 'archived')),
    views_count INTEGER NOT NULL DEFAULT 0,
    favorites_count INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. LISTING IMAGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT,
    is_cover BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. FAVORITES / SAVED LISTINGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_listing_favorite UNIQUE (user_id, listing_id)
);

-- ==============================================================================
-- 7. CONVERSATIONS & IN-APP MESSAGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_conversation_pair UNIQUE (listing_id, buyer_id, seller_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. REVIEWS & RATINGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_review_per_listing UNIQUE (reviewer_id, listing_id)
);

-- ==============================================================================
-- 9. REPORTS / CONTENT MODERATION
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON public.listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON public.reviews(seller_id);

-- ==============================================================================
-- 11. TRIGGERS FOR TIMESTAMPS & USER CREATION
-- ==============================================================================
CREATE OR REPLACE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile record when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, phone_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Furni Explorer'),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.phone
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 12.1 Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 12.2 Categories Policies (Read for all, write restricted)
CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT
USING (true);

-- 12.3 Listings Policies
CREATE POLICY "Active listings are viewable by everyone"
ON public.listings FOR SELECT
USING (status = 'active' OR auth.uid() = seller_id);

CREATE POLICY "Authenticated users can create listings"
ON public.listings FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings"
ON public.listings FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own listings"
ON public.listings FOR DELETE
USING (auth.uid() = seller_id);

-- 12.4 Listing Images Policies
CREATE POLICY "Images of viewable listings are viewable by everyone"
ON public.listing_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = listing_images.listing_id
        AND (listings.status = 'active' OR listings.seller_id = auth.uid())
    )
);

CREATE POLICY "Sellers can manage images for their listings"
ON public.listing_images FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = listing_images.listing_id
        AND listings.seller_id = auth.uid()
    )
);

-- 12.5 Favorites Policies
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- 12.6 Conversations Policies
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can start conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 12.7 Messages Policies
CREATE POLICY "Participants can view conversation messages"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
);

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
);

-- 12.8 Reviews Policies
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Authenticated buyers can leave reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

-- 12.9 Reports Policies
CREATE POLICY "Users can view reports they created"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can submit reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- ==============================================================================
-- 13. SEED DATA FOR CATEGORIES (EN, AM, OM)
-- ==============================================================================
INSERT INTO public.categories (slug, name_en, name_am, name_om, description, icon_name, display_order)
VALUES
    ('living-room', 'Living Room', 'የሳሎን ዕቃዎች', 'Mi''a Saaloonaa', 'Sofas, coffee tables, TV units, and armchairs', 'Sofa', 1),
    ('bedroom', 'Bedroom', 'የመኝታ ቤት ዕቃዎች', 'Mi''a Kutaa Ciisichaa', 'Beds, mattresses, wardrobes, nightstands, and dressers', 'BedDouble', 2),
    ('dining-room', 'Dining & Kitchen', 'የመመገቢያ እና ወጥ ቤት', 'Minjaala Nyaataa fi Kushiinaa', 'Dining tables, chairs, cupboards, and kitchen cabinets', 'Utensils', 3),
    ('office', 'Office & Study', 'የቢሮ ዕቃዎች', 'Mi''a Waajjiraa', 'Executive desks, ergonomic office chairs, and bookshelves', 'Briefcase', 4),
    ('custom-woodcraft', 'Custom Woodcraft', 'ብጁ የእንጨት ጥበብ', 'Hojii Mukaa Aadaa', 'Bespoke artisanal woodwork from Wanza, Tid, and Zigba', 'Hammer', 5),
    ('outdoor', 'Outdoor & Balcony', 'የበረንዳ እና ግቢ', 'Mi''a Dirree fi Balballaa', 'Garden sets, balcony chairs, patio swings, and weatherproof tables', 'TreePine', 6)
ON CONFLICT (slug) DO NOTHING;
