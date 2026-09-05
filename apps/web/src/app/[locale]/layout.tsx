import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import { BRAND } from "@mamuy/shared";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Providers } from "@/components/Providers";
import { SiteShell } from "@/components/SiteShell";
import { LOCALES, isLocale } from "@/i18n/config";
import { OG_IMAGE } from "@/i18n/metadata";
import { resolveLocale } from "@/i18n/server";
import { getMessages, createTranslator } from "@/i18n/translate";
import { authOptions } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-en",
  display: "swap",
});

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-th",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://qr.mamuy.dev";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw;
  const t = createTranslator(getMessages(locale));
  const tagline = t("brand.tagline");
  const description = t("brand.description", { name: BRAND.name });
  const title = `${BRAND.name} | ${tagline}`;
  const ogTitle = t("brand.ogTitle");
  const ogDescription = t("brand.ogDescription");
  return {
    metadataBase: new URL(appUrl),
    title: {
      default: title,
      template: `%s | ${BRAND.name}`,
    },
    description,
    applicationName: BRAND.name,
    keywords:
      locale === "th"
        ? ["Inkue", "QR Code", "สร้าง QR ฟรี", "QR โลโก้", "เปลี่ยนลิงก์ QR", "short link QR"]
        : ["Inkue", "QR Code", "free QR", "QR with logo", "dynamic QR", "short link QR", "track QR scan"],
    authors: [{ name: BRAND.name, url: appUrl }],
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      title: ogTitle,
      description: ogDescription,
      url: appUrl,
      images: [{ ...OG_IMAGE, alt: `${BRAND.name} logo` }],
      locale: locale === "th" ? "th_TH" : "en_US",
      alternateLocale: locale === "th" ? ["en_US"] : ["th_TH"],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [OG_IMAGE.url],
    },
    verification: {
      google: "zLj3F4ZvVBOWSMEDWDvxCF1srWh0mQ9N81k094zHC5c",
    },
    icons: {
      icon: [{ url: "/favicon.svg?v=a", type: "image/svg+xml" }, { url: "/logo.png?v=a" }],
      apple: "/apple-touch-icon.png?v=a",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const locale = await resolveLocale(params);
  const session = await getServerSession(authOptions);
  const t = createTranslator(getMessages(locale));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: BRAND.name,
        url: appUrl,
        logo: `${appUrl}/logo.png`,
      },
      {
        "@type": "SoftwareApplication",
        name: BRAND.name,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
        description: t("brand.description", { name: BRAND.name }),
        url: appUrl,
      },
    ],
  };

  return (
    <html lang={locale} className={`${inter.variable} ${notoThai.variable}`} suppressHydrationWarning>
      <body className={locale === "th" ? notoThai.className : inter.className}>
        <GoogleAnalytics />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Providers locale={locale} session={session}>
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  );
}
