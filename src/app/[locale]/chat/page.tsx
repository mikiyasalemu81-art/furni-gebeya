import { setRequestLocale } from "next-intl/server";
import { ChatClient } from "@/components/chat/chat-client";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChatClient locale={locale} />;
}
