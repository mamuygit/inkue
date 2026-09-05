import { en, type Messages } from "./messages/en";
import { th } from "./messages/th";
import type { Locale } from "./config";

export type { Messages };
export type Translator = (key: string, vars?: Record<string, string | number>) => string;

export type MessageKey = {
  [G in keyof Messages]: {
    [K in keyof Messages[G]]: `${G & string}.${K & string}`;
  }[keyof Messages[G]];
}[keyof Messages];

const catalogs: Record<Locale, Messages> = { en, th };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale];
}

function lookup(messages: Messages, key: string): string | undefined {
  const [group, name] = key.split(".");
  const section = messages[group as keyof Messages];
  if (!section || !name) return undefined;
  const value = section[name as keyof typeof section];
  return typeof value === "string" ? value : undefined;
}

export function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => (vars[name] != null ? String(vars[name]) : `{${name}}`));
}

export function createTranslator(messages: Messages): Translator {
  return (key, vars) => interpolate(lookup(messages, key) ?? key, vars);
}
