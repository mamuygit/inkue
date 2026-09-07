import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { createId } from "../../common/id";
import { QrCode } from "./qr-code.entity";
import { Folder } from "./folder.entity";
import { DonateClick } from "./donate-click.entity";

@Entity({ name: "User" })
export class User {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: "varchar", nullable: true })
  passwordHash: string | null;

  @Column({ type: "timestamptz", nullable: true })
  emailVerifiedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: "varchar", nullable: true })
  avatarKey: string | null;

  @Column({ type: "varchar", default: "none" })
  avatarFrame: string;

  @Column({ type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  disabledAt: Date | null;

  @OneToMany(() => QrCode, (qr) => qr.user)
  qrCodes: QrCode[];

  @OneToMany(() => Folder, (folder) => folder.user)
  folders: Folder[];

  @OneToMany(() => DonateClick, (click) => click.user)
  donateClicks: DonateClick[];

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}
