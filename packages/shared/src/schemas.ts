import { z } from "zod";
import { FRAME_SHAPES, LOGO_POSITIONS } from "./constants";

export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email")
  .transform((v) => v.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Please enter your password"),
});

export const otpRequestSchema = z.object({
  email: emailSchema,
});

export const otpVerifySchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
  locale: z.enum(["en", "th"]).optional(),
});

export const passwordResetSchema = z.object({
  email: emailSchema,
  token: z.string().trim().min(32, "Invalid or expired reset link"),
  password: passwordSchema,
});

export const logoPositionSchema = z.enum(LOGO_POSITIONS);
export const frameShapeSchema = z.enum(FRAME_SHAPES);

export const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Color must be a hex code like #2563EB");

function withHttps(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const destinationUrlSchema = z
  .string()
  .min(1, "Please enter a destination URL")
  .transform(withHttps)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "Invalid destination URL");

export const folderIdSchema = z.string().min(1).optional().nullable();

export const folderCreateSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(40, "Folder name is too long"),
});

export const folderUpdateSchema = z.object({
  name: z.string().trim().min(1, "Folder name is required").max(40, "Folder name is too long").optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const qrCreateSchema = z.object({
  destinationUrl: destinationUrlSchema,
  title: z.string().trim().max(80, "Title is too long").optional().or(z.literal("")),
  qrColor: hexColorSchema.default("#0F172A"),
  bgColor: hexColorSchema.default("#FFFFFF"),
  logoKey: z.string().min(1).optional().nullable(),
  logoPosition: logoPositionSchema.default("center"),
  frameShape: frameShapeSchema.default("none"),
  frameBgColor: hexColorSchema.default("#000000"),
  folderId: folderIdSchema,
});

export const qrUpdateSchema = z.object({
  destinationUrl: destinationUrlSchema.optional(),
  title: z.string().trim().max(80).optional().nullable(),
  qrColor: hexColorSchema.optional(),
  bgColor: hexColorSchema.optional(),
  logoKey: z.string().min(1).optional().nullable(),
  logoPosition: logoPositionSchema.optional(),
  frameShape: frameShapeSchema.optional(),
  frameBgColor: hexColorSchema.optional(),
  removeLogo: z.boolean().optional(),
  folderId: folderIdSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type QrCreateInput = z.infer<typeof qrCreateSchema>;
export type QrUpdateInput = z.infer<typeof qrUpdateSchema>;
export type FolderCreateInput = z.infer<typeof folderCreateSchema>;
export type FolderUpdateInput = z.infer<typeof folderUpdateSchema>;
export type LogoPosition = z.infer<typeof logoPositionSchema>;
export type FrameShape = z.infer<typeof frameShapeSchema>;
