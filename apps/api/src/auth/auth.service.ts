import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { randomBytes, randomInt } from "crypto";
import {
  DISPOSABLE_EMAIL_DOMAINS,
  OTP,
  PASSWORD_RESET,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  registerSchema,
} from "@mamuy/shared";
import { IsNull, Repository } from "typeorm";
import { OtpChallenge, OtpDailyLimit, User } from "../db/entities";
import { MailService } from "../mail/mail.service";
import { parseDto } from "../common/parse-dto";
import { hashPassword, verifyPassword } from "../common/password";
import { bangkokDate, clientIp, hashValue, nextBangkokMidnight, verifyHash } from "../common/util";
import { Request } from "express";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(OtpChallenge) private challenges: Repository<OtpChallenge>,
    @InjectRepository(OtpDailyLimit) private limits: Repository<OtpDailyLimit>,
    private mail: MailService,
    private jwt: JwtService,
  ) {}

  private pepper() {
    return process.env.NEXTAUTH_SECRET ?? "";
  }

  private domainOf(email: string) {
    return email.split("@")[1] ?? "";
  }

  private assertNotDisposable(email: string) {
    if (DISPOSABLE_EMAIL_DOMAINS.has(this.domainOf(email))) {
      throw new BadRequestException("Disposable email addresses aren't supported. Please use a real email.");
    }
  }

  private async bumpLimit(key: string, date: string, field: "sendCount" | "verifyFailCount") {
    let row = await this.limits.findOne({ where: { key, date } });
    if (!row) {
      row = this.limits.create({
        key,
        date,
        sendCount: 0,
        verifyFailCount: 0,
        lastSentAt: null,
      });
    }
    if (field === "sendCount") {
      row.sendCount += 1;
      row.lastSentAt = new Date();
    } else {
      row.verifyFailCount += 1;
    }
    return this.limits.save(row);
  }

  private async issueToken(user: User) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    return {
      id: user.id,
      email: user.email,
      accessToken,
    };
  }

  private async sendRegistrationOtp(email: string, req: Request) {
    const date = bangkokDate();
    const ip = clientIp(req);
    const emailKey = `email:${email}`;
    const ipKey = `ip:${ip}`;
    const unlockAt = nextBangkokMidnight().toISOString();

    const [emailLimit, ipLimit] = await Promise.all([
      this.limits.findOne({ where: { key: emailKey, date } }),
      this.limits.findOne({ where: { key: ipKey, date } }),
    ]);

    if ((emailLimit?.sendCount ?? 0) >= OTP.maxSendPerDay) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: "OTP_DAILY_LIMIT",
          message: "You've used all 5 codes for today. Try again tomorrow.",
          unlockAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if ((ipLimit?.sendCount ?? 0) >= OTP.maxEmailsPerIpPerDay) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: "OTP_IP_LIMIT",
          message: "Too many code requests from this network. Try again tomorrow.",
          unlockAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (emailLimit?.lastSentAt) {
      const elapsed = Date.now() - emailLimit.lastSentAt.getTime();
      const wait = OTP.resendCooldownSec * 1000 - elapsed;
      if (wait > 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            code: "OTP_COOLDOWN",
            message: `Wait ${Math.ceil(wait / 1000)} seconds before sending another code`,
            retryAfterSec: Math.ceil(wait / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const otp = String(randomInt(0, 1_000_000)).padStart(OTP.length, "0");
    const expiresAt = new Date(Date.now() + OTP.ttlMinutes * 60 * 1000);

    await this.challenges.manager.transaction(async (em) => {
      await em.update(
        OtpChallenge,
        { email, purpose: "register", consumedAt: IsNull() },
        { consumedAt: new Date() },
      );
      await em.save(
        em.create(OtpChallenge, {
          email,
          purpose: "register",
          codeHash: hashValue(otp, this.pepper()),
          ip,
          expiresAt,
        }),
      );
    });

    await this.bumpLimit(emailKey, date, "sendCount");
    await this.bumpLimit(ipKey, date, "sendCount");
    await this.mail.sendOtp(email, otp);

    return {
      ok: true as const,
      email,
      expiresInSec: OTP.ttlMinutes * 60,
      remaining: OTP.maxSendPerDay - (emailLimit?.sendCount ?? 0) - 1,
    };
  }

  async register(raw: unknown, req: Request) {
    const { email, password } = parseDto(registerSchema, raw);
    this.assertNotDisposable(email);

    const existing = await this.users.findOne({ where: { email } });
    if (existing?.passwordHash && existing.emailVerifiedAt) {
      throw new HttpException(
        {
          statusCode: HttpStatus.CONFLICT,
          code: "EMAIL_TAKEN",
          message: "An account with this email already exists",
        },
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await hashPassword(password);
    if (!existing) {
      await this.users.save(this.users.create({ email, passwordHash, emailVerifiedAt: null }));
    } else {
      existing.passwordHash = passwordHash;
      await this.users.save(existing);
    }

    return this.sendRegistrationOtp(email, req);
  }

  async login(raw: unknown) {
    const { email, password } = parseDto(loginSchema, raw);
    const user = await this.users.findOne({ where: { email } });
    if (!user?.passwordHash) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const matches = await verifyPassword(password, user.passwordHash);
    if (!matches) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.emailVerifiedAt) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          code: "EMAIL_UNVERIFIED",
          message: "Please verify your email first",
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    user.lastLoginAt = new Date();
    await this.users.save(user);
    return this.issueToken(user);
  }

  async requestOtp(raw: unknown, req: Request) {
    const { email } = parseDto(otpRequestSchema, raw);
    this.assertNotDisposable(email);

    const user = await this.users.findOne({ where: { email } });
    if (!user?.passwordHash || user.emailVerifiedAt) {
      return {
        ok: true,
        email,
        expiresInSec: OTP.ttlMinutes * 60,
        remaining: OTP.maxSendPerDay,
      };
    }

    return this.sendRegistrationOtp(email, req);
  }

  async verifyOtp(raw: unknown) {
    const { email, otp } = parseDto(otpVerifySchema, raw);
    const date = bangkokDate();
    const emailKey = `email:${email}`;
    const unlockAt = nextBangkokMidnight().toISOString();

    const emailLimit = await this.limits.findOne({ where: { key: emailKey, date } });

    if ((emailLimit?.verifyFailCount ?? 0) >= OTP.maxVerifyFailPerDay) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: "OTP_VERIFY_LIMIT",
          message: "Too many failed attempts today. Try again tomorrow.",
          unlockAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const challenge = await this.challenges.findOne({
      where: { email, purpose: "register", consumedAt: IsNull() },
      order: { createdAt: "DESC" },
    });

    const fail = async () => {
      await this.bumpLimit(emailKey, date, "verifyFailCount");
      throw new UnauthorizedException("Invalid or expired OTP");
    };

    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      await fail();
    }

    if (!verifyHash(otp, challenge!.codeHash, this.pepper())) {
      await fail();
    }

    const user = await this.users.findOne({ where: { email } });
    if (!user?.passwordHash) {
      await fail();
    }

    challenge!.consumedAt = new Date();
    await this.challenges.save(challenge!);

    user!.emailVerifiedAt = user!.emailVerifiedAt ?? new Date();
    user!.lastLoginAt = new Date();
    await this.users.save(user!);

    return this.issueToken(user!);
  }

  async me(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email };
  }

  async requestPasswordReset(raw: unknown, req: Request) {
    const { email, locale } = parseDto(passwordResetRequestSchema, raw);
    this.assertNotDisposable(email);

    const date = bangkokDate();
    const ip = clientIp(req);
    const emailKey = `reset:email:${email}`;
    const ipKey = `reset:ip:${ip}`;
    const unlockAt = nextBangkokMidnight().toISOString();

    const [emailLimit, ipLimit] = await Promise.all([
      this.limits.findOne({ where: { key: emailKey, date } }),
      this.limits.findOne({ where: { key: ipKey, date } }),
    ]);

    if ((emailLimit?.sendCount ?? 0) >= OTP.maxSendPerDay) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: "OTP_DAILY_LIMIT",
          message: "You've used all 5 codes for today. Try again tomorrow.",
          unlockAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if ((ipLimit?.sendCount ?? 0) >= OTP.maxEmailsPerIpPerDay) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: "OTP_IP_LIMIT",
          message: "Too many code requests from this network. Try again tomorrow.",
          unlockAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (emailLimit?.lastSentAt) {
      const elapsed = Date.now() - emailLimit.lastSentAt.getTime();
      const wait = OTP.resendCooldownSec * 1000 - elapsed;
      if (wait > 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            code: "OTP_COOLDOWN",
            message: `Wait ${Math.ceil(wait / 1000)} seconds before sending another code`,
            retryAfterSec: Math.ceil(wait / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const user = await this.users.findOne({ where: { email } });
    if (user?.passwordHash && user.emailVerifiedAt) {
      const token = randomBytes(PASSWORD_RESET.tokenBytes).toString("hex");
      const expiresAt = new Date(Date.now() + PASSWORD_RESET.ttlMinutes * 60 * 1000);
      await this.challenges.manager.transaction(async (em) => {
        await em.update(
          OtpChallenge,
          { email, purpose: "reset", consumedAt: IsNull() },
          { consumedAt: new Date() },
        );
        await em.save(
          em.create(OtpChallenge, {
            email,
            purpose: "reset",
            codeHash: hashValue(token, this.pepper()),
            ip,
            expiresAt,
          }),
        );
      });
      const origin = (process.env.NEXT_PUBLIC_APP_URL ?? "https://qr.mamuy.dev").replace(/\/$/, "");
      const path = locale === "th" ? "/th/forgot-password" : "/forgot-password";
      const resetUrl = `${origin}${path}?email=${encodeURIComponent(email)}&token=${token}`;
      await this.mail.sendPasswordResetEmail(email, resetUrl);
    }

    await this.bumpLimit(emailKey, date, "sendCount");
    await this.bumpLimit(ipKey, date, "sendCount");

    return {
      ok: true as const,
      email,
      expiresInSec: PASSWORD_RESET.ttlMinutes * 60,
    };
  }

  async resetPassword(raw: unknown) {
    const { email, token, password } = parseDto(passwordResetSchema, raw);
    const date = bangkokDate();
    const emailKey = `reset:email:${email}`;
    const unlockAt = nextBangkokMidnight().toISOString();

    const emailLimit = await this.limits.findOne({ where: { key: emailKey, date } });
    if ((emailLimit?.verifyFailCount ?? 0) >= OTP.maxVerifyFailPerDay) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: "OTP_VERIFY_LIMIT",
          message: "Too many failed attempts today. Try again tomorrow.",
          unlockAt,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const challenge = await this.challenges.findOne({
      where: { email, purpose: "reset", consumedAt: IsNull() },
      order: { createdAt: "DESC" },
    });

    const fail = async () => {
      await this.bumpLimit(emailKey, date, "verifyFailCount");
      throw new UnauthorizedException("Invalid or expired reset link");
    };

    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      await fail();
    }

    if (!verifyHash(token, challenge!.codeHash, this.pepper())) {
      await fail();
    }

    const user = await this.users.findOne({ where: { email } });
    if (!user?.passwordHash || !user.emailVerifiedAt) {
      await fail();
    }

    challenge!.consumedAt = new Date();
    await this.challenges.save(challenge!);

    user!.passwordHash = await hashPassword(password);
    user!.lastLoginAt = new Date();
    await this.users.save(user!);

    return this.issueToken(user!);
  }
}
