import test from "node:test";
import assert from "node:assert/strict";
import { extractVideoId, selectUnprocessed, fetchYouTubeFeed } from "../scripts/lib/youtube.ts";
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

test("non-YouTube video URLs are rejected", () => {
  assert.throws(() => extractVideoId("https://example.com/watch?v=abcdefghijk"));
  assert.throws(() => extractVideoId("https://youtube.com.example.com/watch?v=abcdefghijk"));
});

test("temporary feed failures recover without calling Gemini", async () => {
  let calls = 0;
  const request = (async () => {
    calls++;
    return calls === 1 ? new Response("", { status: 404 }) : new Response('<feed><entry><yt:videoId>abcdefghijk</yt:videoId><title>Test</title><published>2026-08-28T00:00:00Z</published></entry></feed>');
  }) as typeof fetch;
  const items = await fetchYouTubeFeed("https://www.youtube.com/feeds/videos.xml", request, async () => {});
  assert.equal(calls, 2);
  assert.equal(items[0].youtubeVideoId, "abcdefghijk");
});

test("persistent feed failure stops after three attempts", async () => {
  let calls = 0;
  const request = (async () => { calls++; return new Response("", { status: 404 }); }) as typeof fetch;
  await assert.rejects(fetchYouTubeFeed("https://www.youtube.com/feeds/videos.xml", request, async () => {}), /HTTP 404/);
  assert.equal(calls, 3);
});
