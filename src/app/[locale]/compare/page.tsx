import { setRequestLocale } from "next-intl/server";
import { ComparePageClient } from "@/components/compare/compare-page-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ComparePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ComparePageClient locale={locale} />;
}
