import { Injectable } from "@nestjs/common";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

@Injectable()
export class SpacesService {
  private bucket = process.env.DO_SPACES_BUCKET ?? "";
  private cdn = (process.env.DO_SPACES_CDN_URL ?? "").replace(/\/$/, "");
  private prefix = "qr";
  private client = new S3Client({
    region: "sgp1",
    endpoint: process.env.DO_SPACES_ENDPOINT,
    forcePathStyle: false,
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY ?? "",
      secretAccessKey: process.env.DO_SPACES_SECRET ?? "",
    },
  });

  key(path: string) {
    return `${this.prefix}/${path}`;
  }

  url(key: string) {
    return `${this.cdn}/${key}`;
  }

  async get(key: string) {
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes?.length) throw new Error("empty object");
    return Buffer.from(bytes);
  }

  async put(key: string, body: Buffer, contentType: string) {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ACL: "public-read",
        }),
      );
    } catch {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    }
    return this.url(key);
  }

  async delete(key?: string | null) {
    if (!key) return;
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch {
      // ignore missing objects
    }
  }
}
