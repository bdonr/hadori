import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { LivePulse } from "@/components/LivePulse";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "DADORI — Idea · Team · Capital",
  description: "DADORI connects startups, skilled talent, and investors.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-white text-zinc-900 antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <LivePulse />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
