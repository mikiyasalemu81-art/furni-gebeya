import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
} catch {
  // ignore
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_SECRET_KEY;
const adminPhone = process.env.ADMIN_PHONE || "+251907173634";

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function runCleanup() {
  console.log("=== EXECUTING DATABASE CLEANUP ===");
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Protected Admin Phone: ${adminPhone}\n`);

  // 1. Check Auth Users
  const { data: authData } = await supabase.auth.admin.listUsers();
  const allUsers = authData?.users || [];
  console.log(`Initial auth.users count: ${allUsers.length}`);

  for (const u of allUsers) {
    const isProtected =
      u.phone === adminPhone ||
      u.phone === "251907173634" ||
      u.email?.startsWith("251907173634");

    if (!isProtected) {
      console.log(`Deleting demo auth user: ${u.id} (${u.phone || u.email})`);
      await supabase.auth.admin.deleteUser(u.id);
    } else {
      console.log(`PRESERVING Real Admin User: ${u.id} (${u.phone})`);
    }
  }

  // 2. Clean Test OTPs
  const { count: otpBefore } = await supabase
    .from("otp_codes")
    .select("*", { count: "exact", head: true });
  console.log(`Initial otp_codes count: ${otpBefore}`);

  const { error: delOtpErr } = await supabase
    .from("otp_codes")
    .delete()
    .neq("phone", adminPhone);

  if (delOtpErr) {
    console.error("Error cleaning otp_codes:", delOtpErr.message);
  } else {
    console.log("Cleaned non-admin test OTP codes successfully.");
  }

  const { count: otpAfter } = await supabase
    .from("otp_codes")
    .select("*", { count: "exact", head: true });
  console.log(`Final otp_codes count: ${otpAfter}`);

  // 3. Verify Profiles
  const { data: profiles } = await supabase.from("profiles").select("*");
  console.log(`Profiles remaining: ${profiles?.length || 0}`);
  profiles?.forEach((p) => {
    console.log(`  Profile: ID=${p.id}, Phone=${p.phone || p.phone_number}, Role=${p.role}`);
  });

  console.log("\n=== DATABASE CLEANUP COMPLETE ===");
}

runCleanup().catch(console.error);
