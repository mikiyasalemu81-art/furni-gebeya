import { getCurrentUserProfile } from "@/lib/auth-session";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Server-side Admin Role Enforcement
  const user = await getCurrentUserProfile();

  if (!user || user.role !== "admin") {
    // If user is not admin, redirect away to profile
    redirect(`/${locale}/profile`);
  }

  return <AdminDashboardClient adminUser={user} locale={locale} />;
}
