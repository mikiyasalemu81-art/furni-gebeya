import fs from "node:fs";
import path from "node:path";

// Load .env.local if running directly
try {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [k, ...v] = trimmed.split("=");
        process.env[k.trim()] = v.join("=").trim();
      }
    }
  }
} catch {
  // ignore
}

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeEthiopianPhone } from "@/lib/phone";

async function seedAdmin() {
  const adminPhoneRaw = process.env.ADMIN_PHONE || "+251907173634";
  const validation = normalizeEthiopianPhone(adminPhoneRaw);

  if (!validation.isValid || !validation.normalized) {
    console.error(`[Seed Admin Error] Invalid ADMIN_PHONE: ${adminPhoneRaw}`);
    process.exit(1);
  }

  const phone = validation.normalized;
  console.log(`Seeding Admin Account for phone: ${phone}...`);

  const admin = getSupabaseAdmin();
  if (!admin) {
    console.warn("[Seed Admin Warning] Supabase admin service credentials not configured or in mock mode.");
    console.log(`Admin account ${phone} configured in memory and environment.`);
    return;
  }

  try {
    const cleanDigits = phone.replace(/\D/g, "");
    const syntheticEmail = `${cleanDigits}@phone.furnigebeya.app`;

    // 1. Ensure user exists in auth.users
    let userId: string;
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      phone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { phone, full_name: "Furni Gebeya Master Admin" },
    });

    if (authUser?.user?.id) {
      userId = authUser.user.id;
    } else {
      const { data: userList } = await admin.auth.admin.listUsers();
      const match = userList?.users?.find(
        (u) => u.email === syntheticEmail || u.phone === phone
      );
      if (match?.id) {
        userId = match.id;
      } else {
        throw new Error(authErr?.message || "Could not retrieve or create admin auth user.");
      }
    }

    // 2. Upsert admin profile into public.profiles with role = 'admin'
    const { error: profileErr } = await admin.from("profiles").upsert({
      id: userId,
      phone,
      full_name: "Furni Gebeya Master Admin",
      role: "admin",
      city: "Addis Ababa",
      bio: "Master administrator for Furni Gebeya Marketplace. Overseeing verified suppliers, showrooms, and quality listings.",
      onboarding_done: true,
      updated_at: new Date().toISOString(),
    });

    if (profileErr) {
      throw new Error(profileErr.message);
    }

    console.log(`✓ Admin account created/updated successfully with role = 'admin'!`);
    console.log(`  User ID: ${userId}`);
    console.log(`  Phone:   ${phone}`);
  } catch (err: any) {
    console.error("[Seed Admin Failed]:", err.message);
  }
}

seedAdmin();
