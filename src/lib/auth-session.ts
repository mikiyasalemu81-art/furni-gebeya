import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

import {
  UserRole,
  VerificationStatus,
  UserProfile,
  SEEDED_ADMIN_USER,
} from "@/lib/auth-types";

export type { UserRole, VerificationStatus, UserProfile };
export { SEEDED_ADMIN_USER };

// In-memory profile storage for local dev / mock mode
export const memoryProfiles = new Map<string, UserProfile>([
  [SEEDED_ADMIN_USER.phone_number, SEEDED_ADMIN_USER],
]);

const SESSION_COOKIE_NAME = "furni_user_session";

/**
 * Retrieves the currently logged-in user profile from cookies/database
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const parsed = JSON.parse(sessionCookie) as { phone: string; id: string };
    if (!parsed || !parsed.phone) {
      return null;
    }

    // 1. If it's the seeded admin
    if (parsed.phone === SEEDED_ADMIN_USER.phone_number) {
      return memoryProfiles.get(SEEDED_ADMIN_USER.phone_number) || SEEDED_ADMIN_USER;
    }

    // 2. Check memory profile store
    const memProfile = memoryProfiles.get(parsed.phone);
    if (memProfile) {
      return memProfile;
    }

    // 3. Check Supabase DB if admin client is configured
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data, error } = await admin
        .from("profiles")
        .select("*")
        .eq("phone_number", parsed.phone)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          phone_number: data.phone_number,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          role: data.role as UserRole,
          business_name: data.business_name,
          city: data.city,
          subcity: data.subcity,
          address: data.address,
          bio: data.bio,
          cover_photo_url: data.cover_photo_url,
          whatsapp_number: data.whatsapp_number,
          telegram_username: data.telegram_username,
          map_location_url: data.map_location_url,
          is_verified: Boolean(data.is_verified),
          is_onboarded: Boolean(data.is_onboarded),
          verification_status: (data.verification_status || "unverified") as VerificationStatus,
          is_suspended: Boolean(data.is_suspended),
          suspended_reason: data.suspended_reason,
          trial_started_at: data.trial_started_at,
          trial_ends_at: data.trial_ends_at,
          subscription_status: data.subscription_status || "trial",
          created_at: data.created_at,
        };
      }
    }

    // Default fallback if session exists
    return {
      id: parsed.id,
      phone_number: parsed.phone,
      full_name: "Furni Explorer",
      avatar_url: null,
      role: "buyer",
      city: "Addis Ababa",
      is_verified: false,
      is_onboarded: false,
      verification_status: "unverified",
    };
  } catch {
    return null;
  }
}

/**
 * Creates/retrieves a user upon successful phone OTP verification and establishes session
 */
export async function createOrAuthenticateUser(phone: string): Promise<{
  profile: UserProfile;
  isFirstLogin: boolean;
}> {
  const cookieStore = await cookies();

  // 1. Seeded Admin check
  if (phone === SEEDED_ADMIN_USER.phone_number) {
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({ phone, id: SEEDED_ADMIN_USER.id }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    return { profile: SEEDED_ADMIN_USER, isFirstLogin: false };
  }

  // 2. Check Supabase Admin if available
  const admin = getSupabaseAdmin();
  let existingUser = memoryProfiles.get(phone);
  let isFirstLogin = false;

  if (admin) {
    try {
      const { data: profileData } = await admin
        .from("profiles")
        .select("*")
        .eq("phone_number", phone)
        .maybeSingle();

      if (profileData) {
        existingUser = {
          id: profileData.id,
          phone_number: profileData.phone_number,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          role: profileData.role as UserRole,
          business_name: profileData.business_name,
          city: profileData.city,
          subcity: profileData.subcity,
          address: profileData.address,
          bio: profileData.bio,
          is_verified: Boolean(profileData.is_verified),
          is_onboarded: Boolean(profileData.is_onboarded),
          verification_status: (profileData.verification_status || "unverified") as VerificationStatus,
        };
      } else {
        const { data: authUser } = await admin.auth.admin.createUser({
          phone,
          phone_confirm: true,
          user_metadata: { phone },
        });

        const userId = authUser?.user?.id || crypto.randomUUID();

        const newProfile: UserProfile = {
          id: userId,
          phone_number: phone,
          full_name: `User ${phone.slice(-4)}`,
          avatar_url: null,
          role: "buyer",
          city: "Addis Ababa",
          is_verified: false,
          is_onboarded: false,
          verification_status: "unverified",
        };

        await admin.from("profiles").upsert({
          id: userId,
          phone_number: phone,
          full_name: newProfile.full_name,
          role: "buyer",
          city: "Addis Ababa",
          is_onboarded: false,
          verification_status: "unverified",
        });

        existingUser = newProfile;
        isFirstLogin = true;
      }
    } catch (e) {
      console.warn("[Supabase Server Auth fallback to memory store]", e);
    }
  }

  if (!existingUser) {
    isFirstLogin = true;
    existingUser = {
      id: crypto.randomUUID(),
      phone_number: phone,
      full_name: `Furni Member (${phone.slice(-4)})`,
      avatar_url: null,
      role: "buyer",
      city: "Addis Ababa",
      is_verified: false,
      is_onboarded: false,
      verification_status: "unverified",
    };
    memoryProfiles.set(phone, existingUser);
  } else {
    isFirstLogin = !existingUser.is_onboarded;
  }

  cookieStore.set(
    SESSION_COOKIE_NAME,
    JSON.stringify({ phone: existingUser.phone_number, id: existingUser.id }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    }
  );

  return { profile: existingUser, isFirstLogin };
}

/**
 * Updates user role and marks onboarding as completed
 */
export async function setUserRole(role: UserRole): Promise<UserProfile | null> {
  const current = await getCurrentUserProfile();
  if (!current) return null;

  current.role = role;
  current.is_onboarded = true;
  memoryProfiles.set(current.phone_number, current);

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin
        .from("profiles")
        .update({ role, is_onboarded: true })
        .eq("phone_number", current.phone_number);
    } catch (e) {
      console.error("[Failed to update role in Supabase]", e);
    }
  }

  return current;
}

/**
 * Updates user profile details
 */
export async function updateProfile(data: {
  full_name?: string;
  avatar_url?: string;
  cover_photo_url?: string;
  city?: string;
  subcity?: string;
  address?: string;
  business_name?: string;
  bio?: string;
  whatsapp_number?: string;
  telegram_username?: string;
  map_location_url?: string;
}): Promise<UserProfile | null> {
  const current = await getCurrentUserProfile();
  if (!current) return null;

  if (data.full_name !== undefined) current.full_name = data.full_name.trim();
  if (data.avatar_url !== undefined) current.avatar_url = data.avatar_url;
  if (data.cover_photo_url !== undefined) current.cover_photo_url = data.cover_photo_url;
  if (data.city !== undefined) current.city = data.city;
  if (data.subcity !== undefined) current.subcity = data.subcity;
  if (data.address !== undefined) current.address = data.address;
  if (data.business_name !== undefined) current.business_name = data.business_name;
  if (data.bio !== undefined) current.bio = data.bio;
  if (data.whatsapp_number !== undefined) current.whatsapp_number = data.whatsapp_number;
  if (data.telegram_username !== undefined) current.telegram_username = data.telegram_username;
  if (data.map_location_url !== undefined) current.map_location_url = data.map_location_url;

  memoryProfiles.set(current.phone_number, current);

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin
        .from("profiles")
        .update({
          full_name: current.full_name,
          avatar_url: current.avatar_url,
          cover_photo_url: current.cover_photo_url,
          city: current.city,
          subcity: current.subcity,
          address: current.address,
          business_name: current.business_name,
          bio: current.bio,
          whatsapp_number: current.whatsapp_number,
          telegram_username: current.telegram_username,
          map_location_url: current.map_location_url,
        })
        .eq("phone_number", current.phone_number);
    } catch (e) {
      console.error("[Failed to update profile in Supabase]", e);
    }
  }

  return current;
}

/**
 * Updates user verification status and verified flag
 */
export async function updateUserVerificationStatus(
  userId: string,
  status: VerificationStatus,
  isVerified: boolean,
  docType: "all" | "id" | "license" = "all"
): Promise<void> {
  const now = new Date();
  const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day free trial

  for (const [phone, prof] of memoryProfiles.entries()) {
    if (prof.id === userId) {
      prof.verification_status = status;
      if (docType === "all" || docType === "id") prof.id_verified = isVerified;
      if (docType === "all" || docType === "license") prof.license_verified = isVerified;
      prof.is_verified = Boolean(prof.id_verified || prof.license_verified || isVerified);

      if (status === "approved" && !prof.trial_started_at) {
        prof.trial_started_at = now.toISOString();
        prof.trial_ends_at = trialEnds.toISOString();
        prof.subscription_status = "trial";
      }
      memoryProfiles.set(phone, prof);
      break;
    }
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const updateData: Record<string, any> = {
        verification_status: status,
        is_verified: isVerified,
      };
      if (docType === "all" || docType === "id") updateData.id_verified = isVerified;
      if (docType === "all" || docType === "license") updateData.license_verified = isVerified;

      if (status === "approved") {
        updateData.trial_started_at = now.toISOString();
        updateData.trial_ends_at = trialEnds.toISOString();
        updateData.subscription_status = "trial";
      }
      await admin.from("profiles").update(updateData).eq("id", userId);
    } catch (e) {
      console.error("[Failed to update verification status in Supabase]", e);
    }
  }
}

/**
 * Suspend or reactivate user (Admin action)
 */
export async function setUserSuspension(
  userId: string,
  isSuspended: boolean,
  reason?: string
): Promise<boolean> {
  for (const [phone, prof] of memoryProfiles.entries()) {
    if (prof.id === userId) {
      prof.is_suspended = isSuspended;
      prof.suspended_reason = isSuspended ? reason || "Violation of marketplace terms" : null;
      memoryProfiles.set(phone, prof);
      break;
    }
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      await admin
        .from("profiles")
        .update({
          is_suspended: isSuspended,
          suspended_reason: isSuspended ? reason || "Violation of terms" : null,
          suspended_at: isSuspended ? new Date().toISOString() : null,
        })
        .eq("id", userId);
    } catch (e) {
      console.error("[Failed to update user suspension in Supabase]", e);
    }
  }
  return true;
}

/**
 * Clears user session (logout)
 */
export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
