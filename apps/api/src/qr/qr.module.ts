import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Folder, OtpDailyLimit, QrCode, QrScan } from "../db/entities";
import { GuestQrController } from "./guest-qr.controller";
import { QrController } from "./qr.controller";
import { QrService } from "./qr.service";

@Module({
  imports: [TypeOrmModule.forFeature([Folder, QrCode, QrScan, OtpDailyLimit])],
  controllers: [GuestQrController, QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
