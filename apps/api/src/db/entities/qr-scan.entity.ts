import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { createId } from "../../common/id";
import { QrCode } from "./qr-code.entity";

@Entity({ name: "QrScan" })
@Index(["qrCodeId", "createdAt"])
export class QrScan {
  @PrimaryColumn()
  id: string;

  @Column()
  qrCodeId: string;

  @ManyToOne(() => QrCode, (qr) => qr.scans, { onDelete: "CASCADE" })
  @JoinColumn({ name: "qrCodeId" })
  qrCode: QrCode;

  @Column()
  ipHash: string;

  @Column({ type: "varchar", nullable: true })
  userAgent: string | null;

  @Column({ type: "varchar", nullable: true })
  referer: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}
