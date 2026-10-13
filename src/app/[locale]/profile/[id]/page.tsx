import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { memoryProfiles } from "@/lib/auth-session";
import { getListings } from "@/lib/listings-service";
import { PublicProfileClient } from "@/components/profile/public-profile-client";
import { UserProfile } from "@/lib/auth-types";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  let profileUser: UserProfile | null = null;

  // Check memory store
  for (const prof of memoryProfiles.values()) {
    if (prof.id === id) {
      profileUser = prof;
      break;
    }
  }

  // Check Supabase
  if (!profileUser) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
      if (data) {
        profileUser = {
          id: data.id,
          phone_number: data.phone_number,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          cover_photo_url: data.cover_photo_url,
          role: data.role,
          business_name: data.business_name,
          city: data.city,
          subcity: data.subcity,
          address: data.address,
          bio: data.bio,
          whatsapp_number: data.whatsapp_number,
          telegram_username: data.telegram_username,
          map_location_url: data.map_location_url,
          is_verified: Boolean(data.is_verified),
          is_onboarded: Boolean(data.is_onboarded),
          verification_status: data.verification_status,
          created_at: data.created_at,
        };
      }
    }
  }

  if (!profileUser) {
    notFound();
  }

  // Fetch user listings
  const { listings } = await getListings({
    status: "active",
    limit: 50,
  });

  const userListings = listings.filter((l) => l.seller_id === profileUser!.id);

  return (
    <PublicProfileClient
      profileUser={profileUser}
      listings={userListings}
      locale={locale}
    />
  );
}
