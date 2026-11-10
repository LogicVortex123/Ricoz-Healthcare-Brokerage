import fs from "node:fs/promises";
import path from "node:path";
import { fail, hash } from "./core";

/** Production object storage must implement this private, server-only interface. */
export interface PrivateDocumentStore {
  put(key: string, bytes: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
export interface ScanResult {
  verdict: "clean" | "rejected";
  adapter: string;
  contentHash: string;
}
/** Vendor adapters require a reviewed data-handling agreement before real records are scanned. */
export interface MalwareScanner {
  scan(bytes: Buffer): Promise<ScanResult>;
}
export const storageRoot = () => {
  const root = path.resolve(
    process.env.PRIVATE_STORAGE_PATH ||
      path.join(process.cwd(), ".private-storage"),
  );
  const normalized = root.replace(/\\/g, "/").toLowerCase();
  if (/(^|\/)(public|\.git)(\/|$)/.test(normalized))
    fail(503, "Private document storage cannot use a public or Git directory");
  return root;
};
class LocalDevelopmentStore implements PrivateDocumentStore {
  private file(key: string) {
    if (!/^[a-f0-9]{64}$/.test(key)) fail(500, "Invalid storage key");
    return path.join(storageRoot(), key);
  }
  async put(key: string, bytes: Buffer) {
    await fs.mkdir(storageRoot(), { recursive: true });
    await fs.writeFile(this.file(key), bytes, { flag: "wx", mode: 0o600 });
  }
  async get(key: string) {
    return fs.readFile(this.file(key));
  }
  async remove(key: string) {
    await fs.unlink(this.file(key)).catch((error: any) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
class SyntheticDevelopmentScanner implements MalwareScanner {
  async scan(bytes: Buffer): Promise<ScanResult> {
    if (bytes.includes(Buffer.from("SCAN_FAILURE")))
      fail(503, "Synthetic scanner failure; file remains quarantined");
    return {
      verdict: bytes.includes(Buffer.from("EICAR")) ? "rejected" : "clean",
      adapter: "DEVELOPMENT SYNTHETIC ONLY",
      contentHash: hash(bytes),
    };
  }
}
export function documentStore(): PrivateDocumentStore {
  if (process.env.NODE_ENV === "production")
    fail(503, "Approved private object-storage adapter required");
  return new LocalDevelopmentStore();
}
export function malwareScanner(): MalwareScanner {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.DEV_SCANNER !== "synthetic"
  )
    fail(
      503,
      "Approved malware-scanner adapter required; file remains quarantined",
    );
  return new SyntheticDevelopmentScanner();
}
