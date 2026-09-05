import { BeforeInsert, Column, Entity, PrimaryColumn, Unique } from "typeorm";
import { createId } from "../../common/id";

@Entity({ name: "OtpDailyLimit" })
@Unique(["key", "date"])
export class OtpDailyLimit {
  @PrimaryColumn()
  id: string;

  @Column()
  key: string;

  @Column()
  date: string;

  @Column({ type: "int", default: 0 })
  sendCount: number;

  @Column({ type: "int", default: 0 })
  verifyFailCount: number;

  @Column({ type: "timestamptz", nullable: true })
  lastSentAt: Date | null;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}
