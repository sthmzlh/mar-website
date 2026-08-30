import { mkdir, readFile, rename, writeFile, access } from "node:fs/promises";
import path from "node:path";
import type { LectureSummary } from "./schemas.ts";

export const ROOT = path.resolve(import.meta.dirname, "../..");
export const CONTENT_DIR = path.join(ROOT, "src/content/lectures");
export const PROCESSED_FILE = path.join(ROOT, "scripts/data/processed-videos.json");

export async function readProcessed() {
  const raw = await readFile(PROCESSED_FILE, "utf8");
  const values = JSON.parse(raw);
  if (!Array.isArray(values) || !values.every((value) => typeof value === "string")) throw new Error("Processed-video tracking file is malformed.");
  return new Set<string>(values);
}

export async function articleExists(slug: string) {
  try { await access(path.join(CONTENT_DIR, `${slug}.md`)); return true; } catch { return false; }
}

const field = (value: unknown) => JSON.stringify(value);

export function toMarkdown(summary: LectureSummary) {
  const generatedAt = new Date().toISOString();
  return `---
youtubeVideoId: ${field(summary.youtubeVideoId)}
youtubeUrl: ${field(summary.youtubeUrl)}
originalTitle: ${field(summary.originalTitle)}
urduTitle: ${field(summary.urduTitle)}
englishTitle: ${field(summary.englishTitle)}
slug: ${field(summary.slug)}
publicationDate: ${field(summary.publicationDate)}
thumbnailUrl: ${field(summary.thumbnailUrl)}
shortUrduSummary: ${field(summary.shortUrduSummary)}
detailedUrduSummary: ${field(summary.detailedUrduSummary)}
englishSummary: ${field(summary.englishSummary)}
keyPointsUrdu: ${field(summary.keyPointsUrdu)}
keyPointsEnglish: ${field(summary.keyPointsEnglish)}
topicsUrdu: ${field(summary.topicsUrdu)}
topicsEnglish: ${field(summary.topicsEnglish)}
keywords: ${field(summary.keywords)}
speaker: "Mufti Abdul Raheem"
generatedAt: ${field(generatedAt)}
aiAssisted: true
draft: false
---

${summary.detailedUrduSummary}
`;
}

export async function writeArticle(summary: LectureSummary, force = false) {
  await mkdir(CONTENT_DIR, { recursive: true });
  const destination = path.join(CONTENT_DIR, `${summary.slug}.md`);
  if (!force && await articleExists(summary.slug)) throw new Error(`Article already exists: ${summary.slug}.md`);
  const temporary = `${destination}.tmp`;
  await writeFile(temporary, toMarkdown(summary), { encoding: "utf8", flag: "wx" });
  await rename(temporary, destination);
  return destination;
}

export async function saveProcessed(processed: Set<string>) {
  const temporary = `${PROCESSED_FILE}.tmp`;
  await writeFile(temporary, `${JSON.stringify([...processed].sort(), null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await rename(temporary, PROCESSED_FILE);
}
