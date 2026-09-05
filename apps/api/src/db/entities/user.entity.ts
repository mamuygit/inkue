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

  @OneToMany(() => QrCode, (qr) => qr.user)
  qrCodes: QrCode[];

  @OneToMany(() => Folder, (folder) => folder.user)
  folders: Folder[];

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}
