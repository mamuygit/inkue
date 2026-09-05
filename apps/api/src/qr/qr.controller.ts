import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { Response } from "express";
import { QrService } from "./qr.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { AuthUser, CurrentUser } from "../auth/current-user.decorator";

const imageUpload = FileInterceptor("file", {
  storage: memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

@Controller("qr")
@UseGuards(JwtAuthGuard)
export class QrController {
  constructor(private qr: QrService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.qr.list(user.userId);
  }

  @Post("logo")
  @UseInterceptors(imageUpload)
  uploadLogo(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.qr.uploadLogo(user.userId, file);
  }

  @Post("preview")
  @UseInterceptors(imageUpload)
  @Header("Content-Type", "image/png")
  async preview(
    @CurrentUser() user: AuthUser,
    @Body() body: { payload?: string },
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const raw = body?.payload ? JSON.parse(body.payload) : body;
    const png = await this.qr.preview(user.userId, raw, file);
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.qr.create(user.userId, body);
  }

  @Get(":id/stats")
  stats(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("days") days?: string,
  ) {
    return this.qr.scanStats(user.userId, id, { from, to, days });
  }

  @Get(":id/download")
  async download(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const qr = await this.qr.get(user.userId, id);
    const img = await fetch(qr.imageUrl);
    const buf = Buffer.from(await img.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="inkue-${qr.hash}.png"`);
    res.send(buf);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.qr.get(user.userId, id);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() body: unknown) {
    return this.qr.update(user.userId, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.qr.remove(user.userId, id);
  }
}
