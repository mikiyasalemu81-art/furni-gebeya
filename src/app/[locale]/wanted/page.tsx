import { setRequestLocale } from "next-intl/server";
import { WantedBoardClient } from "@/components/wanted/wanted-board-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function WantedPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <WantedBoardClient locale={locale} />;
}
