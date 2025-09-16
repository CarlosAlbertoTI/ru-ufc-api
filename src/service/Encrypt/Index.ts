import "dotenv/config";
import crypto from "crypto";

import { ALGORITHM } from "../../utils/constants";

const KEY = Buffer.from(process.env.KEY as string, "hex");
if (KEY.length !== 32) {
  throw new Error(
    "Invalid key length: KEY must be 32 bytes for aes-256-gcm. Provide a 64-character hex string in the KEY environment variable."
  );
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encryptedData] = encryptedText.split(":");
  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}