import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { createId } from "../../common/id";
import { User } from "./user.entity";
import { QrScan } from "./qr-scan.entity";
import { Folder } from "./folder.entity";

export type LogoPosition = "center" | "top_left" | "top_right" | "bottom_left" | "bottom_right";
export type FrameShape = "none" | "circle" | "rounded_square";

@Entity({ name: "QrCode" })
@Index(["userId", "createdAt"])
export class QrCode {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.qrCodes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ unique: true })
  hash: string;

  @Column()
  destinationUrl: string;

  @Column({ type: "varchar", nullable: true })
  title: string | null;

  @Column({ default: "#0F172A" })
  qrColor: string;

  @Column({ default: "#FFFFFF" })
  bgColor: string;

  @Column({ type: "varchar", nullable: true })
  logoKey: string | null;

  @Column({
    type: "enum",
    enum: ["center", "top_left", "top_right", "bottom_left", "bottom_right"],
    enumName: "LogoPosition",
    default: "center",
  })
  logoPosition: LogoPosition;

  @Column({
    type: "enum",
    enum: ["none", "circle", "rounded_square"],
    enumName: "FrameShape",
    default: "none",
  })
  frameShape: FrameShape;

  @Column({ default: "#000000" })
  frameBgColor: string;

  @Column()
  imageKey: string;

  @Column({ type: "varchar", nullable: true })
  folderId: string | null;

  @ManyToOne(() => Folder, (folder) => folder.qrCodes, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "folderId" })
  folder: Folder | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => QrScan, (scan) => scan.qrCode)
  scans: QrScan[];

  scanCount?: number;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}
