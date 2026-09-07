import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { Repository } from "typeorm";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt.guard";
import { AuthUser } from "../auth/current-user.decorator";
import { DonateClick } from "../db/entities";
import { clientIp, hashValue } from "../common/util";

@Controller("donate")
export class DonateController {
  constructor(@InjectRepository(DonateClick) private clicks: Repository<DonateClick>) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post("click")
  async click(@Req() req: Request & { user?: AuthUser | null }, @Body() body: { path?: string }) {
    const path = typeof body?.path === "string" ? body.path.slice(0, 300) : null;
    await this.clicks.save(
      this.clicks.create({
        userId: req.user?.userId ?? null,
        ipHash: hashValue(clientIp(req), process.env.NEXTAUTH_SECRET),
        userAgent: req.headers["user-agent"]?.toString().slice(0, 300) ?? null,
        path,
      }),
    );
    return { ok: true };
  }
}
