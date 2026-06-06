import fs from "fs/promises";
import path from "path";
import { BlobNotFoundError, get, head, put } from "@vercel/blob";

export const ALPHA_STORAGE_KEYS = [
  "alpha-history.json",
  "watchlist-history.json",
  "alpha-backtest.json",
  "theme-rotation-history.json",
  "theme-leaders.json",
] as const;

export type AlphaStorageKey = (typeof ALPHA_STORAGE_KEYS)[number];

export type StorageMode = "local" | "blob";

export type StorageKeyHealth = {
  key: AlphaStorageKey;
  exists: boolean;
  size: number;
};

export class StorageWriteError extends Error {
  readonly key: string;

  constructor(key: string, cause: unknown) {
    super(`Failed to write storage key "${key}"`);
    this.name = "StorageWriteError";
    this.key = key;
    this.cause = cause;
  }
}

const LOCAL_DATA_DIR = path.join(process.cwd(), "data");
const BLOB_ACCESS = "private" as const;

export function getStorageMode(): StorageMode {
  return process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local";
}

function localFilePath(key: string): string {
  return path.join(LOCAL_DATA_DIR, key);
}

async function ensureLocalDirectory(): Promise<void> {
  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
}

async function readLocalJson<T>(key: string, fallback: T): Promise<T> {
  try {
    await ensureLocalDirectory();
    const filePath = localFilePath(key);

    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return JSON.parse(raw) as T;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "ENOENT") {
        await writeLocalJson(key, fallback);
        return fallback;
      }
      throw error;
    }
  } catch (error) {
    console.error(`[storage] Failed to read local key "${key}":`, error);
    return fallback;
  }
}

async function writeLocalJson<T>(key: string, data: T): Promise<void> {
  await ensureLocalDirectory();
  const filePath = localFilePath(key);
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, payload, "utf-8");
}

async function readBlobJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const result = await get(key, { access: BLOB_ACCESS });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return fallback;
    }

    const raw = await new Response(result.stream).text();
    return JSON.parse(raw) as T;
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return fallback;
    }
    console.error(`[storage] Failed to read blob key "${key}":`, error);
    return fallback;
  }
}

async function writeBlobJson<T>(key: string, data: T): Promise<void> {
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await put(key, payload, {
    access: BLOB_ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (getStorageMode() === "blob") {
    return readBlobJson(key, fallback);
  }
  return readLocalJson(key, fallback);
}

export async function writeJson<T>(key: string, data: T): Promise<void> {
  try {
    if (getStorageMode() === "blob") {
      await writeBlobJson(key, data);
      return;
    }
    await writeLocalJson(key, data);
  } catch (error) {
    console.error(`[storage] Failed to write key "${key}":`, error);
    throw new StorageWriteError(key, error);
  }
}

export async function upsertJson<T>(
  key: string,
  updater: (current: T) => T | Promise<T>,
  fallback: T,
): Promise<T> {
  const current = await readJson(key, fallback);
  const next = await updater(current);
  await writeJson(key, next);
  return next;
}

async function inspectLocalKey(key: AlphaStorageKey): Promise<StorageKeyHealth> {
  try {
    await ensureLocalDirectory();
    const filePath = localFilePath(key);
    const stat = await fs.stat(filePath);
    return {
      key,
      exists: true,
      size: stat.size,
    };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return { key, exists: false, size: 0 };
    }
    console.error(`[storage] Failed to inspect local key "${key}":`, error);
    return { key, exists: false, size: 0 };
  }
}

async function inspectBlobKey(key: AlphaStorageKey): Promise<StorageKeyHealth> {
  try {
    const metadata = await head(key);
    return {
      key,
      exists: true,
      size: metadata.size,
    };
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return { key, exists: false, size: 0 };
    }
    console.error(`[storage] Failed to inspect blob key "${key}":`, error);
    return { key, exists: false, size: 0 };
  }
}

export async function inspectStorageKeys(): Promise<StorageKeyHealth[]> {
  const inspector =
    getStorageMode() === "blob" ? inspectBlobKey : inspectLocalKey;

  return Promise.all(ALPHA_STORAGE_KEYS.map((key) => inspector(key)));
}

export async function getStorageHealthResponse(): Promise<{
  mode: StorageMode;
  keys: StorageKeyHealth[];
}> {
  return {
    mode: getStorageMode(),
    keys: await inspectStorageKeys(),
  };
}
