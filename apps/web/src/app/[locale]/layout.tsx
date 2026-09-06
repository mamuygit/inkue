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
        ? [
            "Inkue",
            "เครื่องมือสร้าง QR Code ฟรี",
            "QR Code Generator ฟรี",
            "สร้าง QR ฟรี",
            "QR โลโก้",
            "เปลี่ยนลิงก์ QR",
            "dynamic QR",
          ]
        : [
            "Inkue",
            "free QR code generator",
            "QR Code Generator",
            "QR with logo",
            "dynamic QR",
            "change QR link",
            "track QR scan",
          ],
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
      icon: [
        { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
        { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/logo.png", sizes: "256x256", type: "image/png" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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
        "@id": `${appUrl}/#organization`,
        name: BRAND.name,
        alternateName: ["qr.mamuy.dev", "Mamuy Dev QR"],
        url: appUrl,
        logo: `${appUrl}/logo.png`,
        founder: { "@type": "Person", name: "Mamuy Dev", url: "https://mamuy.dev" },
      },
      {
        "@type": ["WebApplication", "SoftwareApplication"],
        "@id": `${appUrl}/#app`,
        name: BRAND.name,
        alternateName: ["Inkue QR Code Generator", "qr.mamuy.dev"],
        url: appUrl,
        image: `${appUrl}/og.png`,
        screenshot: `${appUrl}/og.png`,
        applicationCategory: "UtilitiesApplication",
        applicationSubCategory: "QR Code Generator",
        operatingSystem: "Any",
        browserRequirements: "Requires HTML5 and a modern web browser",
        inLanguage: ["en", "th"],
        isAccessibleForFree: true,
        description: t("brand.description", { name: BRAND.name }),
        featureList: [
          t("home.featureLogoBody"),
          t("home.featureLinkBody"),
          t("home.featureScansBody"),
        ],
        offers: { "@type": "Offer", price: "0", priceCurrency: "THB", availability: "https://schema.org/InStock" },
        publisher: { "@id": `${appUrl}/#organization` },
        creator: { "@id": `${appUrl}/#organization` },
      },
      {
        "@type": "WebSite",
        "@id": `${appUrl}/#website`,
        name: BRAND.name,
        url: appUrl,
        inLanguage: ["en", "th"],
        description: t("home.aioSummary"),
        publisher: { "@id": `${appUrl}/#organization` },
      },
    ],
  };

  return (
    <html lang={locale} className={`${inter.variable} ${notoThai.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" type="image/x-icon" />
        <link rel="icon" href="/favicon-48x48.png" sizes="48x48" type="image/png" />
        <link rel="icon" href="/logo.png" sizes="256x256" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
      </head>
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
