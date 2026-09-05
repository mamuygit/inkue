import { BadRequestException } from "@nestjs/common";
import type { z } from "zod";

export function parseDto<S extends z.ZodTypeAny>(schema: S, raw: unknown): z.infer<S> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new BadRequestException(result.error.issues[0]?.message ?? "Invalid data");
  }
  return result.data;
}
