import { Module } from "@nestjs/common";
import { RedirectController } from "./redirect.controller";
import { QrModule } from "../qr/qr.module";

@Module({
  imports: [QrModule],
  controllers: [RedirectController],
})
export class RedirectModule {}
