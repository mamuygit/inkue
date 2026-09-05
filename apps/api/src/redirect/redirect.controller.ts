import { Controller, Get, Param, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { QrService } from "../qr/qr.service";
import { clientIp } from "../common/util";

@Controller("r")
export class RedirectController {
  constructor(private qr: QrService) {}

  @Get(":hash")
  async go(@Param("hash") hash: string, @Req() req: Request, @Res() res: Response) {
    const url = await this.qr.redirect(
      hash,
      clientIp(req),
      req.headers["user-agent"],
      typeof req.headers.referer === "string" ? req.headers.referer : undefined,
    );
    return res.redirect(302, url);
  }
}
