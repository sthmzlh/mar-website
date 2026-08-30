import test from "node:test";
import assert from "node:assert/strict";
import { extractVideoId, selectUnprocessed } from "../scripts/lib/youtube.ts";
import type { VideoMetadata } from "../scripts/lib/schemas.ts";

const video = (id: string): VideoMetadata => ({
  youtubeVideoId: id,
  youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
  originalTitle: `Video ${id}`,
  publicationDate: "2026-08-28",
  thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
});

test("processed YouTube IDs are skipped", () => {
  const videos = [video("abcdefghijk"), video("lmnopqrstuv")];
  const selected = selectUnprocessed(videos, new Set(["abcdefghijk"]), 5);
  assert.deepEqual(selected.map((item) => item.youtubeVideoId), ["lmnopqrstuv"]);
});

test("explicit force allows intentional reprocessing", () => {
  const videos = [video("abcdefghijk")];
  const selected = selectUnprocessed(videos, new Set(["abcdefghijk"]), 1, "abcdefghijk", true);
  assert.equal(selected.length, 1);
});

test("YouTube watch and short URLs are parsed without page scraping", () => {
  assert.equal(extractVideoId("https://www.youtube.com/watch?v=abcdefghijk"), "abcdefghijk");
  assert.equal(extractVideoId("https://youtu.be/abcdefghijk"), "abcdefghijk");
});
