import { setRequestLocale } from "next-intl/server";
import { OnboardingRoleClient } from "@/components/auth/onboarding-role-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingRolePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OnboardingRoleClient locale={locale} />;
}
