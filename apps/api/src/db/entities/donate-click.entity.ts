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
import { User } from "./user.entity";

@Entity({ name: "DonateClick" })
@Index(["createdAt"])
@Index(["userId", "createdAt"])
export class DonateClick {
  @PrimaryColumn()
  id: string;

  @Column({ type: "varchar", nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.donateClicks, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "userId" })
  user: User | null;

  @Column()
  ipHash: string;

  @Column({ type: "varchar", nullable: true })
  userAgent: string | null;

  @Column({ type: "varchar", nullable: true })
  path: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}
