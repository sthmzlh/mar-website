import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { GEMINI_MODEL, summarizeVideo } from "./lib/gemini.ts";
import { readProcessed, ROOT, saveProcessed, writeArticle } from "./lib/content.ts";
import { extractVideoId, fetchYouTubeFeed, selectUnprocessed } from "./lib/youtube.ts";

const { values } = parseArgs({
  options: {
    limit: { type: "string", short: "l", default: "1" },
    url: { type: "string", short: "u" },
    force: { type: "boolean", default: false },
  },
  allowPositionals: false,
});

const limit = Number.parseInt(values.limit ?? "1", 10);
if (!Number.isInteger(limit) || limit < 1 || limit > 15) throw new Error("--limit must be an integer from 1 to 15.");
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is required for ingestion. The static website can still build without it.");

const config = JSON.parse(await readFile(path.join(ROOT, "scripts/config/youtube-channel.json"), "utf8"));
console.log("Checking the official YouTube RSS feed…");
const videos = await fetchYouTubeFeed(config.feedUrl);
console.log(`Videos detected: ${videos.length}`);
const processed = await readProcessed();
console.log(`Videos already processed: ${processed.size}`);
const requestedId = values.url ? extractVideoId(values.url) : undefined;
const selected = selectUnprocessed(videos, processed, limit, requestedId, values.force);
console.log(`New videos selected: ${selected.length}`);
console.log(`Gemini model: ${GEMINI_MODEL}; automatic API retries: disabled`);

if (!selected.length) {
  console.log(requestedId && processed.has(requestedId) ? "Requested video is already processed; use --force to intentionally reprocess it." : "No new videos to process.");
  process.exit(0);
}

for (const [index, video] of selected.entries()) {
  console.log(`Processing video ${index + 1}/${selected.length}: ${video.youtubeVideoId} — ${video.originalTitle}`);
  const summary = await summarizeVideo(video, apiKey);
  console.log("Structured output validation passed.");
  const article = await writeArticle(summary, values.force);
  processed.add(video.youtubeVideoId);
  await saveProcessed(processed);
  console.log(`Article generated: ${path.relative(ROOT, article)}`);
}

console.log("Ingestion completed successfully.");
