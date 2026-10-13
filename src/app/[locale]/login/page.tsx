import { setRequestLocale } from "next-intl/server";
import { LoginPageClient } from "@/components/auth/login-page-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginPageClient locale={locale} />;
}
