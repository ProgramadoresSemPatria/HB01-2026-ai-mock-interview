import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createRequire } from "node:module";

import type { IObjectStorage } from "@/modules/resumes/protocols/object-storage";

const require = createRequire(import.meta.url);

export type R2ObjectStorageConfig = {
  bucketName: string;
};

export class R2ObjectStorage implements IObjectStorage {
  constructor(
    private readonly client: S3Client,
    private readonly config: R2ObjectStorageConfig,
  ) {}

  async put(
    key: string,
    body: Buffer | Uint8Array,
    contentType?: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: body,
        ...(contentType !== undefined ? { ContentType: contentType } : {}),
      }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      }),
    );

    if (response.Body === undefined) {
      throw new Error(`R2 object "${key}" has no body`);
    }

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      }),
    );
  }
}

type EnvServerR2Module = {
  env: {
    R2_ENDPOINT: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
  };
};

function readEnvR2Config(): R2ObjectStorageConfig & {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
} {
  const { env } = require("@/config/env") as EnvServerR2Module;

  return {
    bucketName: env.R2_BUCKET_NAME,
    endpoint: env.R2_ENDPOINT,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  };
}

export function createR2ObjectStorage(
  client?: S3Client,
  config?: Partial<R2ObjectStorageConfig>,
): IObjectStorage {
  if (client && config?.bucketName) {
    return new R2ObjectStorage(client, { bucketName: config.bucketName });
  }

  const fromEnv = readEnvR2Config();

  return new R2ObjectStorage(
    client ??
      new S3Client({
        region: "auto",
        endpoint: fromEnv.endpoint,
        credentials: {
          accessKeyId: fromEnv.accessKeyId,
          secretAccessKey: fromEnv.secretAccessKey,
        },
        forcePathStyle: true,
      }),
    { bucketName: config?.bucketName ?? fromEnv.bucketName },
  );
}
