import { Body, Controller, Headers, Post, Req, Res } from "@nestjs/common";
import { GUEST_QR } from "@mamuy/shared";
import { Request, Response } from "express";
import { QrService } from "./qr.service";
import { clientIp } from "../common/util";

@Controller("guest/qr")
export class GuestQrController {
  constructor(private qr: QrService) {}

  @Post()
  create(
    @Body() body: unknown,
    @Headers(GUEST_QR.tokenHeader) guestToken: string | undefined,
    @Req() req: Request,
  ) {
    return this.qr.createGuest(body, guestToken, clientIp(req));
  }

  @Post("static")
  async static(@Body() body: unknown, @Res() res: Response) {
    const png = await this.qr.staticGuest(body);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  }
}
