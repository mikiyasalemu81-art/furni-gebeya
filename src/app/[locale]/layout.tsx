import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, locales } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { PhoneLoginModal } from "@/components/auth/phone-login-modal";
import { RoleSelectionModal } from "@/components/auth/role-selection-modal";
import { ProfileEditModal } from "@/components/auth/profile-edit-modal";
import { OnboardingWrapper } from "@/components/auth/onboarding-wrapper";
import { TopBar } from "@/components/navigation/top-bar";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { getCurrentUserProfile } from "@/lib/auth-session";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { CompareProvider } from "@/components/compare/compare-provider";
import { CompareTray } from "@/components/compare/compare-tray";
import "../globals.css";

export const metadata: Metadata = {
  title: "Furni Gebeya | Ethiopia's Furniture Marketplace",
  description:
    "Discover handcrafted and modern furniture directly from carpenters and verified sellers across Ethiopia.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-512.svg",
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const initialUser = await getCurrentUserProfile();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider initialUser={initialUser}>
              <CompareProvider>
                <div className="relative flex min-h-screen flex-col">
                  <TopBar />
                  <main className="flex-1 pb-24">{children}</main>
                  <CompareTray />
                  <BottomNav />
                </div>
                <PhoneLoginModal />
                <RoleSelectionModal />
                <ProfileEditModal />
                <OnboardingWrapper />
                <PwaRegister />
              </CompareProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
