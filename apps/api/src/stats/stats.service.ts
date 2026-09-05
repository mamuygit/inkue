import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QrCode, QrScan } from "../db/entities";
import { bangkokDate } from "../common/util";
import { resolveDateRange } from "../common/date-range";
import { scanBreakdown } from "../common/scan-breakdown";

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(QrCode) private qrs: Repository<QrCode>,
    @InjectRepository(QrScan) private scans: Repository<QrScan>,
  ) {}

  async publicStats() {
    const totalQr = await this.qrs.count();
    return { totalQr };
  }

  async mine(userId: string, query: { from?: string; to?: string; days?: string | number } = {}) {
    const range = resolveDateRange(query);
    const totalQr = await this.qrs.count({ where: { userId } });

    const createdInRange = await this.qrs
      .createQueryBuilder("qr")
      .where("qr.userId = :userId", { userId })
      .andWhere("qr.createdAt >= :start AND qr.createdAt < :end", {
        start: range.start,
        end: range.endExclusive,
      })
      .getCount();

    const scanRows = await this.scans
      .createQueryBuilder("scan")
      .innerJoin("scan.qrCode", "qr")
      .where("qr.userId = :userId", { userId })
      .andWhere("scan.createdAt >= :start AND scan.createdAt < :end", {
        start: range.start,
        end: range.endExclusive,
      })
      .getMany();

    const usedIds = new Set(scanRows.map((row) => row.qrCodeId));
    const buckets = new Map(range.dates.map((date) => [date, 0]));
    for (const scan of scanRows) {
      const key = bangkokDate(scan.createdAt);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const { byReferrer, byDevice } = scanBreakdown(scanRows);

    const byQrRaw = await this.scans
      .createQueryBuilder("scan")
      .innerJoin("scan.qrCode", "qr")
      .where("qr.userId = :userId", { userId })
      .andWhere("scan.createdAt >= :start AND scan.createdAt < :end", {
        start: range.start,
        end: range.endExclusive,
      })
      .select("qr.id", "id")
      .addSelect("qr.title", "title")
      .addSelect("qr.destinationUrl", "destinationUrl")
      .addSelect("COUNT(*)", "scanCount")
      .groupBy("qr.id")
      .addGroupBy("qr.title")
      .addGroupBy("qr.destinationUrl")
      .orderBy("COUNT(*)", "DESC")
      .limit(15)
      .getRawMany<{ id: string; title: string | null; destinationUrl: string; scanCount: string }>();

    return {
      totalQr,
      createdInRange,
      usedInRange: usedIds.size,
      scansInRange: scanRows.length,
      from: range.from,
      to: range.to,
      days: [...buckets.entries()].map(([date, count]) => ({ date, count })),
      byQr: byQrRaw.map((row) => ({
        id: row.id,
        title: row.title,
        destinationUrl: row.destinationUrl,
        scanCount: Number(row.scanCount),
      })),
      byReferrer,
      byDevice,
    };
  }
}
