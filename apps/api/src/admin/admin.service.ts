import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DonateClick, QrCode, QrScan, User } from "../db/entities";
import { resolveDateRange } from "../common/date-range";
import { bangkokDate } from "../common/util";
import { scanBreakdown } from "../common/scan-breakdown";
import { SpacesService } from "../spaces/spaces.service";

const QR_BASE = () =>
  (process.env.NEXT_PUBLIC_QR_BASE_URL ?? "https://q.mamuy.dev").replace(/\/$/, "");

const TOP_N = 15;

function parsePage(query: { page?: string; limit?: string }) {
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit) || 20)));
  return { page, limit, skip: (page - 1) * limit };
}

function fillDays(dates: string[], rows: { date: string; count: string }[]) {
  const buckets = new Map(dates.map((date) => [date, 0]));
  for (const row of rows) {
    if (buckets.has(row.date)) buckets.set(row.date, Number(row.count) || 0);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(QrCode) private qrs: Repository<QrCode>,
    @InjectRepository(QrScan) private scans: Repository<QrScan>,
    @InjectRepository(DonateClick) private donates: Repository<DonateClick>,
    private spaces: SpacesService,
  ) {}

  private scanUrl(hash: string) {
    return `${QR_BASE()}/${hash}`;
  }

  private bangkokDayExpr(alias: string, column: string) {
    return `to_char(${alias}.${column} AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD')`;
  }

  async overview(query: { from?: string; to?: string; days?: string | number } = {}) {
    const range = resolveDateRange(query);
    const rangeWhere = { start: range.start, end: range.endExclusive };

    const [
      totalUsers,
      verifiedUsers,
      usersInRange,
      totalQr,
      createdInRange,
      scansInRange,
      donateInRange,
      donateSignedIn,
      usedRaw,
      scanDays,
      qrDays,
      userDays,
      donateDays,
      scanMeta,
      topQrRaw,
      topUsersByQrRaw,
      topUsersByScansRaw,
      topDonorsRaw,
    ] = await Promise.all([
      this.users.count(),
      this.users.createQueryBuilder("user").where("user.emailVerifiedAt IS NOT NULL").getCount(),
      this.users
        .createQueryBuilder("user")
        .where("user.createdAt >= :start AND user.createdAt < :end", rangeWhere)
        .getCount(),
      this.qrs.count(),
      this.qrs
        .createQueryBuilder("qr")
        .where("qr.createdAt >= :start AND qr.createdAt < :end", rangeWhere)
        .getCount(),
      this.scans
        .createQueryBuilder("scan")
        .where("scan.createdAt >= :start AND scan.createdAt < :end", rangeWhere)
        .getCount(),
      this.donates
        .createQueryBuilder("donate")
        .where("donate.createdAt >= :start AND donate.createdAt < :end", rangeWhere)
        .getCount(),
      this.donates
        .createQueryBuilder("donate")
        .where("donate.createdAt >= :start AND donate.createdAt < :end", rangeWhere)
        .andWhere("donate.userId IS NOT NULL")
        .getCount(),
      this.scans
        .createQueryBuilder("scan")
        .select("COUNT(DISTINCT scan.qrCodeId)", "count")
        .where("scan.createdAt >= :start AND scan.createdAt < :end", rangeWhere)
        .getRawOne<{ count: string }>(),
      this.scans
        .createQueryBuilder("scan")
        .select(this.bangkokDayExpr("scan", "createdAt"), "date")
        .addSelect("COUNT(*)", "count")
        .where("scan.createdAt >= :start AND scan.createdAt < :end", rangeWhere)
        .groupBy("date")
        .getRawMany<{ date: string; count: string }>(),
      this.qrs
        .createQueryBuilder("qr")
        .select(this.bangkokDayExpr("qr", "createdAt"), "date")
        .addSelect("COUNT(*)", "count")
        .where("qr.createdAt >= :start AND qr.createdAt < :end", rangeWhere)
        .groupBy("date")
        .getRawMany<{ date: string; count: string }>(),
      this.users
        .createQueryBuilder("user")
        .select(this.bangkokDayExpr("user", "createdAt"), "date")
        .addSelect("COUNT(*)", "count")
        .where("user.createdAt >= :start AND user.createdAt < :end", rangeWhere)
        .groupBy("date")
        .getRawMany<{ date: string; count: string }>(),
      this.donates
        .createQueryBuilder("donate")
        .select(this.bangkokDayExpr("donate", "createdAt"), "date")
        .addSelect("COUNT(*)", "count")
        .where("donate.createdAt >= :start AND donate.createdAt < :end", rangeWhere)
        .groupBy("date")
        .getRawMany<{ date: string; count: string }>(),
      this.scans
        .createQueryBuilder("scan")
        .select(["scan.userAgent", "scan.referer"])
        .where("scan.createdAt >= :start AND scan.createdAt < :end", rangeWhere)
        .getMany(),
      this.scans
        .createQueryBuilder("scan")
        .innerJoin("scan.qrCode", "qr")
        .innerJoin("qr.user", "user")
        .where("scan.createdAt >= :start AND scan.createdAt < :end", rangeWhere)
        .select("qr.id", "id")
        .addSelect("qr.title", "title")
        .addSelect("qr.destinationUrl", "destinationUrl")
        .addSelect("qr.hash", "hash")
        .addSelect("user.id", "userId")
        .addSelect("user.email", "email")
        .addSelect("COUNT(*)", "scanCount")
        .groupBy("qr.id")
        .addGroupBy("qr.title")
        .addGroupBy("qr.destinationUrl")
        .addGroupBy("qr.hash")
        .addGroupBy("user.id")
        .addGroupBy("user.email")
        .orderBy("COUNT(*)", "DESC")
        .limit(TOP_N)
        .getRawMany<{
          id: string;
          title: string | null;
          destinationUrl: string;
          hash: string;
          userId: string;
          email: string;
          scanCount: string;
        }>(),
      this.users
        .createQueryBuilder("user")
        .leftJoin("user.qrCodes", "qr")
        .select("user.id", "id")
        .addSelect("user.email", "email")
        .addSelect("COUNT(qr.id)", "qrCount")
        .groupBy("user.id")
        .addGroupBy("user.email")
        .orderBy("COUNT(qr.id)", "DESC")
        .limit(TOP_N)
        .getRawMany<{ id: string; email: string; qrCount: string }>(),
      this.scans
        .createQueryBuilder("scan")
        .innerJoin("scan.qrCode", "qr")
        .innerJoin("qr.user", "user")
        .where("scan.createdAt >= :start AND scan.createdAt < :end", rangeWhere)
        .select("user.id", "id")
        .addSelect("user.email", "email")
        .addSelect("COUNT(*)", "scanCount")
        .groupBy("user.id")
        .addGroupBy("user.email")
        .orderBy("COUNT(*)", "DESC")
        .limit(TOP_N)
        .getRawMany<{ id: string; email: string; scanCount: string }>(),
      this.donates
        .createQueryBuilder("donate")
        .leftJoin("donate.user", "user")
        .where("donate.createdAt >= :start AND donate.createdAt < :end", rangeWhere)
        .select("user.id", "userId")
        .addSelect("user.email", "email")
        .addSelect("COUNT(*)", "count")
        .groupBy("user.id")
        .addGroupBy("user.email")
        .orderBy("COUNT(*)", "DESC")
        .limit(TOP_N)
        .getRawMany<{ userId: string | null; email: string | null; count: string }>(),
    ]);

    const usedInRange = Number(usedRaw?.count ?? 0);
    const { byReferrer, byDevice } = scanBreakdown(scanMeta);

    return {
      from: range.from,
      to: range.to,
      totalUsers,
      verifiedUsers,
      usersInRange,
      totalQr,
      createdInRange,
      usedInRange,
      unusedInRange: Math.max(0, totalQr - usedInRange),
      scansInRange,
      donateInRange,
      donateSignedIn,
      donateAnonymous: Math.max(0, donateInRange - donateSignedIn),
      days: {
        scans: fillDays(range.dates, scanDays),
        qr: fillDays(range.dates, qrDays),
        users: fillDays(range.dates, userDays),
        donates: fillDays(range.dates, donateDays),
      },
      byReferrer,
      byDevice,
      topQr: topQrRaw.map((row) => ({
        id: row.id,
        title: row.title,
        destinationUrl: row.destinationUrl,
        hash: row.hash,
        scanUrl: this.scanUrl(row.hash),
        owner: { id: row.userId, email: row.email },
        scanCount: Number(row.scanCount),
      })),
      topUsersByQr: topUsersByQrRaw.map((row) => ({
        id: row.id,
        email: row.email,
        qrCount: Number(row.qrCount),
      })),
      topUsersByScans: topUsersByScansRaw.map((row) => ({
        id: row.id,
        email: row.email,
        scanCount: Number(row.scanCount),
      })),
      topDonors: topDonorsRaw.map((row) => ({
        userId: row.userId ?? null,
        email: row.email ?? null,
        count: Number(row.count),
      })),
    };
  }

  async listUsers(query: { q?: string; page?: string; limit?: string }) {
    const { page, limit, skip } = parsePage(query);
    const q = query.q?.trim();
    const qb = this.users
      .createQueryBuilder("user")
      .leftJoin("user.qrCodes", "qr")
      .leftJoin("qr.scans", "scan")
      .leftJoin("user.donateClicks", "donate")
      .select("user.id", "id")
      .addSelect("user.email", "email")
      .addSelect("user.createdAt", "createdAt")
      .addSelect("user.lastLoginAt", "lastLoginAt")
      .addSelect("user.emailVerifiedAt", "emailVerifiedAt")
      .addSelect("COUNT(DISTINCT qr.id)", "qrCount")
      .addSelect("COUNT(DISTINCT scan.id)", "scanCount")
      .addSelect("COUNT(DISTINCT donate.id)", "donateCount")
      .groupBy("user.id")
      .addGroupBy("user.email")
      .addGroupBy("user.createdAt")
      .addGroupBy("user.lastLoginAt")
      .addGroupBy("user.emailVerifiedAt")
      .orderBy("user.createdAt", "DESC");

    if (q) qb.andWhere("user.email ILIKE :q", { q: `%${q}%` });

    const countQb = this.users.createQueryBuilder("user");
    if (q) countQb.where("user.email ILIKE :q", { q: `%${q}%` });
    const total = await countQb.getCount();
    const rows = await qb.skip(skip).take(limit).getRawMany<{
      id: string;
      email: string;
      createdAt: Date;
      lastLoginAt: Date | null;
      emailVerifiedAt: Date | null;
      qrCount: string;
      scanCount: string;
      donateCount: string;
    }>();

    return {
      page,
      limit,
      total,
      items: rows.map((row) => ({
        id: row.id,
        email: row.email,
        createdAt: row.createdAt,
        lastLoginAt: row.lastLoginAt,
        verified: Boolean(row.emailVerifiedAt),
        qrCount: Number(row.qrCount),
        scanCount: Number(row.scanCount),
        donateCount: Number(row.donateCount),
      })),
    };
  }

  async getUser(id: string) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    const qrs = await this.qrs
      .createQueryBuilder("qr")
      .loadRelationCountAndMap("qr.scanCount", "qr.scans")
      .where("qr.userId = :id", { id })
      .orderBy("qr.createdAt", "DESC")
      .getMany();

    const [scanCount, donateCount] = await Promise.all([
      this.scans.createQueryBuilder("scan").innerJoin("scan.qrCode", "qr").where("qr.userId = :id", { id }).getCount(),
      this.donates.count({ where: { userId: id } }),
    ]);

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      verified: Boolean(user.emailVerifiedAt),
      qrCount: qrs.length,
      scanCount,
      donateCount,
      qrs: qrs.map((qr) => this.mapQr(qr, user.email)),
    };
  }

  async listQr(query: { q?: string; page?: string; limit?: string }) {
    const { page, limit, skip } = parsePage(query);
    const q = query.q?.trim();
    const qb = this.qrs
      .createQueryBuilder("qr")
      .leftJoinAndSelect("qr.user", "user")
      .loadRelationCountAndMap("qr.scanCount", "qr.scans")
      .orderBy("qr.createdAt", "DESC");

    if (q) {
      qb.andWhere(
        "(qr.title ILIKE :q OR qr.destinationUrl ILIKE :q OR qr.hash ILIKE :q OR user.email ILIKE :q)",
        { q: `%${q}%` },
      );
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return {
      page,
      limit,
      total,
      items: items.map((qr) => this.mapQr(qr, qr.user?.email ?? "")),
    };
  }

  async getQr(id: string) {
    const qr = await this.qrs
      .createQueryBuilder("qr")
      .leftJoinAndSelect("qr.user", "user")
      .loadRelationCountAndMap("qr.scanCount", "qr.scans")
      .where("qr.id = :id", { id })
      .getOne();
    if (!qr) throw new NotFoundException("QR not found");
    return this.mapQr(qr, qr.user?.email ?? "");
  }

  async qrStats(id: string, query: { from?: string; to?: string; days?: string | number } = {}) {
    const qr = await this.qrs.findOne({ where: { id } });
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

  async listDonates(query: { from?: string; to?: string; days?: string | number; page?: string; limit?: string }) {
    const range = resolveDateRange(query);
    const { page, limit, skip } = parsePage(query);
    const qb = this.donates
      .createQueryBuilder("donate")
      .leftJoinAndSelect("donate.user", "user")
      .where("donate.createdAt >= :start AND donate.createdAt < :end", {
        start: range.start,
        end: range.endExclusive,
      })
      .orderBy("donate.createdAt", "DESC");

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return {
      page,
      limit,
      total,
      from: range.from,
      to: range.to,
      items: items.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        path: row.path,
        userId: row.userId,
        email: row.user?.email ?? null,
      })),
    };
  }

  private mapQr(qr: QrCode, email: string) {
    return {
      id: qr.id,
      hash: qr.hash,
      scanUrl: this.scanUrl(qr.hash),
      destinationUrl: qr.destinationUrl,
      title: qr.title,
      imageUrl: this.spaces.url(qr.imageKey),
      scanCount: qr.scanCount ?? 0,
      createdAt: qr.createdAt,
      owner: { id: qr.userId, email },
    };
  }
}
