/**
 * One-time migration: encrypt any plaintext sensitive tokens stored in the DB.
 * Safe to run multiple times — already-encrypted values (contain ':') are skipped.
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/encrypt-existing-tokens.ts
 */

import { PrismaClient } from "@prisma/client";

// Inline encrypt to avoid Next.js path aliases
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function encrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY env var not set");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, "hex"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

const isPlaintext = (v: string) => !v.includes(":");

const prisma = new PrismaClient();

async function main() {
  // Load ENCRYPTION_KEY from .env.local if not in environment
  if (!process.env.ENCRYPTION_KEY) {
    const fs = await import("fs");
    const path = await import("path");
    const envPath = path.resolve(__dirname, "../apps/web/.env.local");
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, "utf8").split("\n");
      for (const line of lines) {
        const m = line.match(/^ENCRYPTION_KEY=(.+)$/);
        if (m) process.env.ENCRYPTION_KEY = m[1].replace(/"/g, "");
      }
    }
  }

  if (!process.env.ENCRYPTION_KEY) {
    console.error("❌  ENCRYPTION_KEY not found. Set it in .env.local or env.");
    process.exit(1);
  }

  const clients = await prisma.client.findMany({
    select: { id: true, facebookAccessToken: true, n8nWebhookUrl: true, greenApiToken: true },
  });

  let migrated = 0;
  for (const client of clients) {
    const updates: Record<string, string | null> = {};

    if (client.facebookAccessToken && isPlaintext(client.facebookAccessToken)) {
      updates.facebookAccessToken = encrypt(client.facebookAccessToken);
    }
    if (client.n8nWebhookUrl && isPlaintext(client.n8nWebhookUrl)) {
      updates.n8nWebhookUrl = encrypt(client.n8nWebhookUrl);
    }
    if (client.greenApiToken && isPlaintext(client.greenApiToken)) {
      updates.greenApiToken = encrypt(client.greenApiToken);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.client.update({ where: { id: client.id }, data: updates });
      console.log(`✅  Encrypted ${Object.keys(updates).join(", ")} for client ${client.id}`);
      migrated++;
    }
  }

  // Migrate SystemSettings too
  const settings = await prisma.systemSettings.findMany({
    select: { id: true, resendKey: true, twilioToken: true },
  });

  for (const s of settings) {
    const updates: Record<string, string | null> = {};
    if (s.resendKey && isPlaintext(s.resendKey)) updates.resendKey = encrypt(s.resendKey);
    if (s.twilioToken && isPlaintext(s.twilioToken)) updates.twilioToken = encrypt(s.twilioToken);
    if (Object.keys(updates).length > 0) {
      await prisma.systemSettings.update({ where: { id: s.id }, data: updates });
      console.log(`✅  Encrypted settings for settings record ${s.id}`);
      migrated++;
    }
  }

  if (migrated === 0) {
    console.log("✅  Nothing to migrate — all tokens already encrypted or empty.");
  } else {
    console.log(`\n✅  Migrated ${migrated} record(s).`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
