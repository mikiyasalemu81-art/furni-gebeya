import { setRequestLocale } from "next-intl/server";
import { OnboardingWelcomeClient } from "@/components/auth/onboarding-welcome-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function OnboardingWelcomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OnboardingWelcomeClient locale={locale} />;
}
