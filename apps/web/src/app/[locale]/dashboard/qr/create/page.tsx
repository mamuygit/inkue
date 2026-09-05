import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { QrEditor } from "@/components/QrEditor";
import { getT, resolveLocale } from "@/i18n/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  return {
    title: t("dashboard.create"),
    robots: { index: false, follow: false },
  };
}

export default async function CreateQrPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const { t } = await getT(locale);
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography component="h1" variant="h4" fontWeight={800} sx={{ mb: 3 }}>
        {t("dashboard.createNew")}
      </Typography>
      <QrEditor />
    </Container>
  );
}
