import { BeforeInsert, Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";
import { createId } from "../../common/id";

@Entity({ name: "OtpChallenge" })
@Index(["email", "createdAt"])
export class OtpChallenge {
  @PrimaryColumn()
  id: string;

  @Column()
  email: string;

  @Column({ type: "varchar", default: "register" })
  purpose: "register" | "reset";

  @Column()
  codeHash: string;

  @Column({ type: "varchar", nullable: true })
  ip: string | null;

  @Column({ type: "timestamptz" })
  expiresAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = createId();
  }
}
