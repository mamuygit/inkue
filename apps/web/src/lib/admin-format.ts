export function formatWhen(value: string | Date | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(locale === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function shortLabel(title: string | null | undefined, destinationUrl: string) {
  const raw = (title || destinationUrl).replace(/^https?:\/\//, "");
  return raw.length > 28 ? `${raw.slice(0, 27)}…` : raw;
}
