import QRCode from "qrcode";
import sharp from "sharp";
import type { FrameShape, LogoPosition } from "@mamuy/shared";

export type ComposeInput = {
  data: string;
  qrColor: string;
  bgColor: string;
  logo?: Buffer | null;
  logoPosition: LogoPosition;
  frameShape: FrameShape;
  frameBgColor: string;
};

const SIZE = 1024;
const LOGO_UNREADABLE = "Couldn't read that logo. Try a PNG or JPG instead.";

function looksLikeSvg(buf: Buffer) {
  const head = buf.subarray(0, Math.min(buf.length, 512)).toString("utf8").trimStart().toLowerCase();
  return head.startsWith("<svg") || head.startsWith("<?xml") || head.includes("<svg");
}

/** Sharp fails on many Figma/Illustrator SVGs that have viewBox but no width/height. */
function ensureSvgDimensions(buf: Buffer) {
  if (!looksLikeSvg(buf)) return buf;
  const text = buf.toString("utf8");
  if (/\bwidth\s*=/.test(text) && /\bheight\s*=/.test(text)) return buf;
  const vb = text.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  const parts = vb?.[1].trim().split(/[\s,]+/).map(Number) ?? [];
  const w = Number.isFinite(parts[2]) && parts[2] > 0 ? Math.round(parts[2]) : 1024;
  const h = Number.isFinite(parts[3]) && parts[3] > 0 ? Math.round(parts[3]) : 1024;
  return Buffer.from(text.replace(/<svg\b/i, `<svg width="${w}" height="${h}"`));
}

async function decodeLogo(logo: Buffer) {
  const prepared = ensureSvgDimensions(logo);
  try {
    return await sharp(prepared, {
      failOn: "none",
      density: 300,
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .toColorspace("srgb")
      .ensureAlpha()
      .png()
      .toBuffer();
  } catch {
    throw new Error(LOGO_UNREADABLE);
  }
}

function positionBox(position: LogoPosition, badge: number) {
  const center = Math.round((SIZE - badge) / 2);
  // Keep finder patterns (3 corners) clear — sit inside the data area.
  const inset = Math.round(SIZE * 0.26);
  switch (position) {
    case "top_left":
      return { left: inset, top: inset };
    case "top_right":
      return { left: SIZE - inset - badge, top: inset };
    case "bottom_left":
      return { left: inset, top: SIZE - inset - badge };
    case "bottom_right":
      return { left: SIZE - inset - badge, top: SIZE - inset - badge };
    default:
      return { left: center, top: center };
  }
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

async function makeBadge(
  logo: Buffer,
  badgeSize: number,
  frameShape: FrameShape,
  frameBgColor: string,
) {
  const border = Math.max(10, Math.round(badgeSize * 0.08));
  const innerPad = Math.max(8, Math.round(badgeSize * 0.1));
  const inner = badgeSize - border * 2;
  const logoBox = inner - innerPad * 2;
  const radiusOuter =
    frameShape === "circle" ? badgeSize / 2 : Math.round(badgeSize * 0.22);
  const radiusInner =
    frameShape === "circle" ? inner / 2 : Math.round(inner * 0.2);
  const fill = frameShape === "none" ? "#FFFFFF" : frameBgColor;

  const svg = Buffer.from(
    `<svg width="${badgeSize}" height="${badgeSize}" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="${badgeSize - 6}" height="${badgeSize - 6}" rx="${radiusOuter}" fill="#000000" opacity="0.18"/>
      <rect width="${badgeSize}" height="${badgeSize}" rx="${radiusOuter}" fill="#FFFFFF"/>
      <rect x="${border}" y="${border}" width="${inner}" height="${inner}" rx="${radiusInner}" fill="${fill}"/>
    </svg>`,
  );

  const frame = await sharp(svg).png().toBuffer();
  const logoFit = await sharp(logo)
    .resize(logoBox, logoBox, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const rx = frameShape === "circle" ? logoBox / 2 : Math.round(logoBox * 0.18);
  const mask = Buffer.from(
    `<svg width="${logoBox}" height="${logoBox}"><rect width="${logoBox}" height="${logoBox}" rx="${rx}" fill="white"/></svg>`,
  );
  const clipped = await sharp(logoFit)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return sharp(frame)
    .composite([
      {
        input: clipped,
        left: border + innerPad,
        top: border + innerPad,
      },
    ])
    .png()
    .toBuffer();
}

export async function composeQr(input: ComposeInput): Promise<Buffer> {
  const rgb = hexToRgb(input.bgColor);
  const qrBuf = await QRCode.toBuffer(input.data, {
    errorCorrectionLevel: input.logo ? "H" : "M",
    type: "png",
    width: SIZE,
    margin: 2,
    color: { dark: input.qrColor, light: input.bgColor },
  });

  if (!input.logo) {
    return sharp(qrBuf)
      .flatten({ background: rgb })
      .png()
      .toBuffer();
  }

  const logo = await decodeLogo(input.logo);
  const badgeSize =
    input.logoPosition === "center" ? Math.round(SIZE * 0.3) : Math.round(SIZE * 0.2);
  const badge = await makeBadge(
    logo,
    badgeSize,
    input.frameShape,
    input.frameBgColor,
  );
  const { left, top } = positionBox(input.logoPosition, badgeSize);

  return sharp(qrBuf)
    .composite([{ input: badge, left, top }])
    .png()
    .toBuffer();
}
