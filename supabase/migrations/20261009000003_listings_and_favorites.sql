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

-- 3. SEED INITIAL DEMO DATA FOR LISTINGS
-- Uses the seeded admin account or known profile IDs
DO $$
DECLARE
    admin_id UUID := 'a0000000-0000-0000-0000-000000000001';
    living_cat UUID;
    bedroom_cat UUID;
    dining_cat UUID;
    office_cat UUID;
    custom_cat UUID;
    outdoor_cat UUID;
    l1 UUID := gen_random_uuid();
    l2 UUID := gen_random_uuid();
    l3 UUID := gen_random_uuid();
    l4 UUID := gen_random_uuid();
    l5 UUID := gen_random_uuid();
    l6 UUID := gen_random_uuid();
BEGIN
    SELECT id INTO living_cat FROM public.categories WHERE slug = 'living-room' LIMIT 1;
    SELECT id INTO bedroom_cat FROM public.categories WHERE slug = 'bedroom' LIMIT 1;
    SELECT id INTO dining_cat FROM public.categories WHERE slug = 'dining-room' LIMIT 1;
    SELECT id INTO office_cat FROM public.categories WHERE slug = 'office' LIMIT 1;
    SELECT id INTO custom_cat FROM public.categories WHERE slug = 'custom-woodcraft' LIMIT 1;
    SELECT id INTO outdoor_cat FROM public.categories WHERE slug = 'outdoor' LIMIT 1;

    -- Listing 1: Handcrafted Wanza Dining Table
    INSERT INTO public.listings (
        id, seller_id, category_id, title, description, price, currency, price_type,
        condition, wood_type, material, dimensions, city, subcity, specific_location,
        status, is_featured, views_count
    ) VALUES (
        l1, admin_id, dining_cat,
        'Handcrafted Wanza Wood 6-Seater Dining Table',
        'Authentic Ethiopian Wanza (Cordia africana) dining set. Hand-sanded and treated with natural matte beeswax finish. Comes with 6 ergonomic matching chairs.',
        48500, 'ETB', 'fixed', 'new', 'Wanza (ዋንዛ)', 'Solid Hardwood & Cushioned Seats', '200x100x78 cm',
        'Addis Ababa', 'Kirkos', 'Shola Market, Workshop 12', 'active', TRUE, 142
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.listing_images (listing_id, image_url, is_cover, display_order)
    VALUES
        (l1, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80', TRUE, 0),
        (l1, 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80', FALSE, 1),
        (l1, 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=800&auto=format&fit=crop&q=80', FALSE, 2)
    ON CONFLICT DO NOTHING;

    -- Listing 2: Luxury Velvet L-Shape Sofa
    INSERT INTO public.listings (
        id, seller_id, category_id, title, description, price, currency, price_type,
        condition, wood_type, material, dimensions, city, subcity, specific_location,
        status, is_featured, views_count
    ) VALUES (
        l2, admin_id, living_cat,
        'Modern Emerald Green Velvet L-Shape Sectional Sofa',
        'Premium high-density orthopedic foam with stain-resistant velvet fabric and sturdy solid Tid frame. Includes 4 decorative accent cushions.',
        65000, 'ETB', 'fixed', 'new', 'Tid (ጥድ)', 'Velvet Fabric & High Density Foam', '280x180x85 cm',
        'Addis Ababa', 'Bole', 'Atlas Road, Showroom 4', 'active', TRUE, 289
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.listing_images (listing_id, image_url, is_cover, display_order)
    VALUES
        (l2, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80', TRUE, 0),
        (l2, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=80', FALSE, 1)
    ON CONFLICT DO NOTHING;

    -- Listing 3: Custom Coffee Ceremony Table & Stools
    INSERT INTO public.listings (
        id, seller_id, category_id, title, description, price, currency, price_type,
        condition, wood_type, material, dimensions, city, subcity, specific_location,
        status, is_featured, views_count
    ) VALUES (
        l3, admin_id, custom_cat,
        'Artisanal Coffee Ceremony Set (Rekebot & 6 Carved Stools)',
        'Traditional Ethiopian cultural coffee table hand-carved with historical Lalibela and Aksum geometric motifs. Includes 6 matching mini-stools (Barchuma).',
        0, 'ETB', 'ask_price', 'new', 'Zigba (ዝግባ)', 'Hand-Carved Solid Wood & Brass Trim', '110x60x45 cm',
        'Addis Ababa', 'Arada', 'Piassa Heritage Craft Center', 'active', TRUE, 310
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.listing_images (listing_id, image_url, is_cover, display_order)
    VALUES
        (l3, 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80', TRUE, 0),
        (l3, 'https://images.unsplash.com/photo-1540518614846-7ede433c4b49?w=800&auto=format&fit=crop&q=80', FALSE, 1)
    ON CONFLICT DO NOTHING;

    -- Listing 4: Solid Wood King Size Bed
    INSERT INTO public.listings (
        id, seller_id, category_id, title, description, price, currency, price_type,
        condition, wood_type, material, dimensions, city, subcity, specific_location,
        status, is_featured, views_count
    ) VALUES (
        l4, admin_id, bedroom_cat,
        'King Size Platform Bed with Under-Bed Storage Drawers',
        'Sturdy king size bed frame crafted from Ethiopian Pine & Wanza. Four integrated smooth sliding storage drawers and upholstered headboard.',
        42000, 'ETB', 'fixed', 'new', 'Wanza & Pine', 'Solid Timber & Fabric Tufting', '200x180x110 cm',
        'Hawassa', 'Tabor', 'Piazza Street, Hawassa', 'active', FALSE, 98
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.listing_images (listing_id, image_url, is_cover, display_order)
    VALUES
        (l4, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80', TRUE, 0),
        (l4, 'https://images.unsplash.com/photo-1540518614846-7ede433c4b49?w=800&auto=format&fit=crop&q=80', FALSE, 1)
    ON CONFLICT DO NOTHING;

    -- Listing 5: Gently Used Executive Desk
    INSERT INTO public.listings (
        id, seller_id, category_id, title, description, price, currency, price_type,
        condition, wood_type, material, dimensions, city, subcity, specific_location,
        status, is_featured, views_count
    ) VALUES (
        l5, admin_id, office_cat,
        'Heavy Duty Executive Office Desk with Cable Management',
        'Spacious L-shaped executive desk with 3 lockable drawers and integrated power socket grommets. Gently used for 6 months, excellent condition.',
        24500, 'ETB', 'fixed', 'used', 'Oak Veneer & Steel', 'Hardwood Veneer & Black Metal Legs', '180x90x75 cm',
        'Addis Ababa', 'Kirkos', 'Kazanchis, Guinea Conakry St', 'active', FALSE, 156
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.listing_images (listing_id, image_url, is_cover, display_order)
    VALUES
        (l5, 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80', TRUE, 0)
    ON CONFLICT DO NOTHING;

    -- Listing 6: Weatherproof Patio Chairs
    INSERT INTO public.listings (
        id, seller_id, category_id, title, description, price, currency, price_type,
        condition, wood_type, material, dimensions, city, subcity, specific_location,
        status, is_featured, views_count
    ) VALUES (
        l6, admin_id, outdoor_cat,
        'Handmade Weatherproof Garden & Balcony Rattan Lounge Set',
        'Includes 2 deep lounge armchairs and 1 tempered glass coffee table. UV-resistant synthetic weave on rustproof aluminum frames.',
        31000, 'ETB', 'fixed', 'new', 'Treated Acacia', 'All-Weather Rattan & Aluminum', 'Armchair: 75x70x80 cm',
        'Bishoftu', 'Kuriftu Area', 'Near Lake Kuriftu Resort', 'active', FALSE, 114
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.listing_images (listing_id, image_url, is_cover, display_order)
    VALUES
        (l6, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80', TRUE, 0)
    ON CONFLICT DO NOTHING;
END $$;
