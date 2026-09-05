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
  Unique,
} from "typeorm";
import { createId } from "../../common/id";
import { User } from "./user.entity";
import { QrCode } from "./qr-code.entity";

@Entity({ name: "Folder" })
@Unique(["userId", "name"])
@Index(["userId", "sortOrder"])
export class Folder {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.folders, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "varchar", length: 40 })
  name: string;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => QrCode, (qr) => qr.folder)
  qrCodes: QrCode[];

  qrCount?: number;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}
