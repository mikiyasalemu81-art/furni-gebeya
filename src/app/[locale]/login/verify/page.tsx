import { setRequestLocale } from "next-intl/server";
import { LoginVerifyClient } from "@/components/auth/login-verify-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginVerifyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginVerifyClient locale={locale} />;
}
