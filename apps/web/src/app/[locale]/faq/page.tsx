import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { BRAND } from "@mamuy/shared";
import { publicPageMetadata } from "@/i18n/metadata";
import { getT, resolveLocale } from "@/i18n/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  return {
    ...publicPageMetadata("/faq", locale, {
      title: t("faq.title"),
      description: t("faq.description", { name: BRAND.name }),
    }),
    title: { absolute: t("faq.title") },
  };
}

export default async function FaqPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  const faqs = [
    { q: t("faq.qWhat"), a: t("faq.aWhat") },
    { q: t("faq.qGenerate"), a: t("faq.aGenerate") },
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2", { domain: BRAND.scanDomain }) },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Typography component="h1" variant="h3" fontWeight={800} sx={{ mb: 4 }}>
        {t("faq.title")}
      </Typography>
      {faqs.map((f) => (
        <Box key={f.q} component="section" sx={{ mb: 4 }}>
          <Typography component="h2" variant="h6" fontWeight={800}>
            {f.q}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {f.a}
          </Typography>
        </Box>
      ))}
    </Container>
  );
}
