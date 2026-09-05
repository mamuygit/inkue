import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Folder, QrCode, QrScan } from "../db/entities";
import { QrController } from "./qr.controller";
import { QrService } from "./qr.service";

@Module({
  imports: [TypeOrmModule.forFeature([Folder, QrCode, QrScan])],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
