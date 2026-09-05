import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { nanoid } from "nanoid";
import {
  QR_HASH_LENGTH,
  qrCreateSchema,
  qrUpdateSchema,
  type QrCreateInput,
} from "@mamuy/shared";
import { Repository } from "typeorm";
import { Folder, QrCode, QrScan } from "../db/entities";
import { SpacesService } from "../spaces/spaces.service";
import { composeQr } from "./qr-compose";
import { bangkokDate, hashValue } from "../common/util";
import { scanBreakdown } from "../common/scan-breakdown";
import { parseDto } from "../common/parse-dto";
import { resolveDateRange } from "../common/date-range";

const QR_BASE = () =>
  (process.env.NEXT_PUBLIC_QR_BASE_URL ?? "https://q.mamuy.dev").replace(/\/$/, "");

@Injectable()
export class QrService {
  constructor(
    @InjectRepository(QrCode) private qrs: Repository<QrCode>,
    @InjectRepository(QrScan) private scans: Repository<QrScan>,
    @InjectRepository(Folder) private folders: Repository<Folder>,
    private spaces: SpacesService,
  ) {}

  private scanUrl(hash: string) {
    return `${QR_BASE()}/${hash}`;
  }

  private map(row: QrCode) {
    return {
      id: row.id,
      hash: row.hash,
      scanUrl: this.scanUrl(row.hash),
      destinationUrl: row.destinationUrl,
      title: row.title,
      qrColor: row.qrColor,
      bgColor: row.bgColor,
      logoKey: row.logoKey,
      logoUrl: row.logoKey ? this.spaces.url(row.logoKey) : null,
      logoPosition: row.logoPosition,
      frameShape: row.frameShape,
      frameBgColor: row.frameBgColor,
      imageUrl: this.spaces.url(row.imageKey),
      folderId: row.folderId ?? null,
      scanCount: row.scanCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async resolveFolderId(userId: string, folderId?: string | null) {
    if (folderId === undefined) return undefined;
    if (!folderId) return null;
    const folder = await this.folders.findOne({ where: { id: folderId, userId } });
    if (!folder) throw new BadRequestException("Folder not found");
    return folder.id;
  }

  private withScanCount() {
    return this.qrs
      .createQueryBuilder("qr")
      .loadRelationCountAndMap("qr.scanCount", "qr.scans");
  }

  async uploadLogo(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException("Please choose a logo file");
    const mime = (file.mimetype || "").toLowerCase();
    const name = (file.originalname || "").toLowerCase();
    const allowedMime = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/pjpeg",
      "image/webp",
      "image/svg+xml",
    ];
    const allowedExt = /\.(png|jpe?g|webp|svg)$/;
    if (!allowedMime.includes(mime) && !allowedExt.test(name)) {
      throw new BadRequestException("Only PNG, JPG, WEBP, and SVG are supported");
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException("File must be 2MB or smaller");
    }
    const ext = mime.includes("svg") || name.endsWith(".svg")
      ? "svg"
      : mime.includes("webp") || name.endsWith(".webp")
        ? "webp"
        : mime.includes("png") || name.endsWith(".png")
          ? "png"
          : "jpeg";
    const key = this.spaces.key(`logos/${userId}/${nanoid(10)}.${ext}`);
    const url = await this.spaces.put(key, file.buffer, mime || `image/${ext === "svg" ? "svg+xml" : ext}`);
    return { key, url };
  }

  private async uniqueHash() {
    for (let i = 0; i < 8; i++) {
      const hash = nanoid(QR_HASH_LENGTH);
      const exists = await this.qrs.findOne({ where: { hash } });
      if (!exists) return hash;
    }
    throw new BadRequestException("Couldn't create a QR code. Please try again.");
  }

  private async loadLogo(logoKey?: string | null) {
    if (!logoKey) return null;
    try {
      return await this.spaces.get(logoKey);
    } catch {
      throw new BadRequestException("Uploaded logo not found");
    }
  }

  private async renderAndStore(
    hash: string,
    input: Pick<
      QrCreateInput,
      "qrColor" | "bgColor" | "logoKey" | "logoPosition" | "frameShape" | "frameBgColor"
    >,
  ) {
    const logo = await this.loadLogo(input.logoKey);
    const png = await this.composeOrThrow({
      data: this.scanUrl(hash),
      qrColor: input.qrColor,
      bgColor: input.bgColor,
      logo,
      logoPosition: input.logoPosition,
      frameShape: input.frameShape,
      frameBgColor: input.frameBgColor,
    });
    const imageKey = this.spaces.key(`codes/${hash}.png`);
    await this.spaces.put(imageKey, png, "image/png");
    return imageKey;
  }

  async create(userId: string, raw: unknown) {
    const input = parseDto(qrCreateSchema, raw);
    const hash = await this.uniqueHash();
    const imageKey = await this.renderAndStore(hash, {
      qrColor: input.qrColor,
      bgColor: input.bgColor,
      logoKey: input.logoKey,
      logoPosition: input.logoPosition,
      frameShape: input.frameShape,
      frameBgColor: input.frameBgColor,
    });

    const folderId = await this.resolveFolderId(userId, input.folderId);
    const saved = await this.qrs.save(
      this.qrs.create({
        userId,
        hash,
        destinationUrl: input.destinationUrl,
        title: input.title || null,
        qrColor: input.qrColor,
        bgColor: input.bgColor,
        logoKey: input.logoKey ?? null,
        logoPosition: input.logoPosition,
        frameShape: input.frameShape,
        frameBgColor: input.frameBgColor,
        imageKey,
        folderId: folderId ?? null,
      }),
    );
    saved.scanCount = 0;
    return this.map(saved);
  }

  async list(userId: string) {
    const rows = await this.withScanCount()
      .where("qr.userId = :userId", { userId })
      .orderBy("qr.createdAt", "DESC")
      .getMany();
    return rows.map((r) => this.map(r));
  }

  async get(userId: string, id: string) {
    const row = await this.withScanCount()
      .where("qr.id = :id AND qr.userId = :userId", { id, userId })
      .getOne();
    if (!row) throw new NotFoundException("QR not found");
    return this.map(row);
  }

  async update(userId: string, id: string, raw: unknown) {
    const input = parseDto(qrUpdateSchema, raw);
    const existing = await this.qrs.findOne({ where: { id, userId } });
    if (!existing) throw new NotFoundException("QR not found");

    const logoKey = input.removeLogo ? null : input.logoKey === undefined ? existing.logoKey : input.logoKey;
    const folderId =
      input.folderId === undefined ? existing.folderId : await this.resolveFolderId(userId, input.folderId);
    const next = {
      destinationUrl: input.destinationUrl ?? existing.destinationUrl,
      title: input.title === undefined ? existing.title : input.title,
      qrColor: input.qrColor ?? existing.qrColor,
      bgColor: input.bgColor ?? existing.bgColor,
      logoKey,
      logoPosition: input.logoPosition ?? existing.logoPosition,
      frameShape: input.frameShape ?? existing.frameShape,
      frameBgColor: input.frameBgColor ?? existing.frameBgColor,
      folderId: folderId ?? null,
    };

    const styleChanged =
      next.qrColor !== existing.qrColor ||
      next.bgColor !== existing.bgColor ||
      next.logoKey !== existing.logoKey ||
      next.logoPosition !== existing.logoPosition ||
      next.frameShape !== existing.frameShape ||
      next.frameBgColor !== existing.frameBgColor;

    let imageKey = existing.imageKey;
    if (styleChanged) {
      imageKey = await this.renderAndStore(existing.hash, next);
    }

    Object.assign(existing, next, { imageKey });
    await this.qrs.save(existing);
    return this.get(userId, id);
  }

  async remove(userId: string, id: string) {
    const existing = await this.qrs.findOne({ where: { id, userId } });
    if (!existing) throw new NotFoundException("QR not found");
    await this.qrs.remove(existing);
    await this.spaces.delete(existing.imageKey);
    await this.spaces.delete(existing.logoKey);
    return { ok: true };
  }

  private async composeOrThrow(input: Parameters<typeof composeQr>[0]) {
    try {
      return await composeQr(input);
    } catch (err) {
      if (!input.logo) throw err;
      const message = err instanceof Error ? err.message : "";
      if (message.includes("Couldn't read that logo")) {
        throw new BadRequestException(message);
      }
      throw new BadRequestException("Couldn't read that logo. Try a PNG or JPG instead.");
    }
  }

  async preview(userId: string, raw: unknown, logoFile?: Express.Multer.File) {
    const input = parseDto(qrCreateSchema, raw);
    let logo: Buffer | null = logoFile?.buffer ?? null;
    if (!logo && input.logoKey) logo = await this.loadLogo(input.logoKey);
    return this.composeOrThrow({
      data: this.scanUrl("preview"),
      qrColor: input.qrColor,
      bgColor: input.bgColor,
      logo,
      logoPosition: input.logoPosition,
      frameShape: input.frameShape,
      frameBgColor: input.frameBgColor,
    });
  }

  async scanStats(
    userId: string,
    id: string,
    query: { from?: string; to?: string; days?: string | number } = {},
  ) {
    const qr = await this.qrs.findOne({ where: { id, userId } });
    if (!qr) throw new NotFoundException("QR not found");
    const range = resolveDateRange(query);
    const scans = await this.scans
      .createQueryBuilder("scan")
      .where("scan.qrCodeId = :id", { id })
      .andWhere("scan.createdAt >= :start AND scan.createdAt < :end", {
        start: range.start,
        end: range.endExclusive,
      })
      .select(["scan.id", "scan.createdAt", "scan.userAgent", "scan.referer"])
      .orderBy("scan.createdAt", "ASC")
      .getMany();
    const buckets = new Map(range.dates.map((date) => [date, 0]));
    for (const scan of scans) {
      const key = bangkokDate(scan.createdAt);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const { byReferrer, byDevice } = scanBreakdown(scans);
    return {
      total: await this.scans.count({ where: { qrCodeId: id } }),
      scansInRange: scans.length,
      from: range.from,
      to: range.to,
      days: [...buckets.entries()].map(([date, count]) => ({ date, count })),
      byReferrer,
      byDevice,
    };
  }

  async redirect(hash: string, ip: string, userAgent?: string, referer?: string) {
    const qr = await this.qrs.findOne({ where: { hash } });
    if (!qr) throw new NotFoundException("Link not found");
    await this.scans.save(
      this.scans.create({
        qrCodeId: qr.id,
        ipHash: hashValue(ip, process.env.NEXTAUTH_SECRET),
        userAgent: userAgent?.slice(0, 300) ?? null,
        referer: referer?.slice(0, 500) ?? null,
      }),
    );
    return qr.destinationUrl;
  }
}
