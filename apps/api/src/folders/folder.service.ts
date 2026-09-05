import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { folderCreateSchema, folderUpdateSchema } from "@mamuy/shared";
import { Repository } from "typeorm";
import { Folder } from "../db/entities";
import { parseDto } from "../common/parse-dto";

@Injectable()
export class FolderService {
  constructor(@InjectRepository(Folder) private folders: Repository<Folder>) {}

  private map(row: Folder) {
    return {
      id: row.id,
      name: row.name,
      sortOrder: row.sortOrder,
      qrCount: row.qrCount ?? 0,
      createdAt: row.createdAt,
    };
  }

  private withCount() {
    return this.folders
      .createQueryBuilder("folder")
      .loadRelationCountAndMap("folder.qrCount", "folder.qrCodes");
  }

  private async assertUniqueName(userId: string, name: string, exceptId?: string) {
    const qb = this.folders
      .createQueryBuilder("folder")
      .where("folder.userId = :userId", { userId })
      .andWhere("LOWER(folder.name) = LOWER(:name)", { name });
    if (exceptId) qb.andWhere("folder.id != :exceptId", { exceptId });
    const exists = await qb.getOne();
    if (exists) throw new BadRequestException("Folder name already exists");
  }

  async list(userId: string) {
    const rows = await this.withCount()
      .where("folder.userId = :userId", { userId })
      .orderBy("folder.sortOrder", "ASC")
      .addOrderBy("folder.createdAt", "ASC")
      .getMany();
    return rows.map((row) => this.map(row));
  }

  async create(userId: string, raw: unknown) {
    const input = parseDto(folderCreateSchema, raw);
    await this.assertUniqueName(userId, input.name);
    const max = await this.folders
      .createQueryBuilder("folder")
      .select("MAX(folder.sortOrder)", "max")
      .where("folder.userId = :userId", { userId })
      .getRawOne<{ max: string | null }>();
    const saved = await this.folders.save(
      this.folders.create({
        userId,
        name: input.name,
        sortOrder: (Number(max?.max) || 0) + 1,
      }),
    );
    saved.qrCount = 0;
    return this.map(saved);
  }

  async update(userId: string, id: string, raw: unknown) {
    const input = parseDto(folderUpdateSchema, raw);
    const existing = await this.folders.findOne({ where: { id, userId } });
    if (!existing) throw new NotFoundException("Folder not found");
    if (input.name !== undefined && input.name !== existing.name) {
      await this.assertUniqueName(userId, input.name, id);
      existing.name = input.name;
    }
    if (input.sortOrder !== undefined) existing.sortOrder = input.sortOrder;
    await this.folders.save(existing);
    const row = await this.withCount()
      .where("folder.id = :id AND folder.userId = :userId", { id, userId })
      .getOne();
    return this.map(row ?? existing);
  }

  async remove(userId: string, id: string) {
    const existing = await this.folders.findOne({ where: { id, userId } });
    if (!existing) throw new NotFoundException("Folder not found");
    await this.folders.remove(existing);
    return { ok: true };
  }
}
