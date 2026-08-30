import type { VideoMetadata } from "./schemas.ts";
import { videoMetadataSchema } from "./schemas.ts";

const decodeXml = (value: string) => value
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match ? decodeXml(match[1].trim()) : "";
}

export async function fetchYouTubeFeed(feedUrl: string): Promise<VideoMetadata[]> {
  let response: Response;
  try {
    response = await fetch(feedUrl, { headers: { "user-agent": "muftiabdulraheem.com lecture archive/1.0" } });
  } catch (error) {
    throw new Error(`YouTube feed unavailable: ${error instanceof Error ? error.message : "network error"}`);
  }
  if (!response.ok) throw new Error(`YouTube feed unavailable: HTTP ${response.status}`);
  const xml = await response.text();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];
  if (!entries.length) throw new Error("YouTube feed returned no video entries.");
  return entries.map((entry) => {
    const youtubeVideoId = tag(entry, "yt:videoId");
    const published = tag(entry, "published");
    return videoMetadataSchema.parse({
      youtubeVideoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      originalTitle: tag(entry, "title"),
      publicationDate: published.slice(0, 10),
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`,
    });
  });
}

export function extractVideoId(url: string) {
  const parsed = new URL(url);
  const id = parsed.hostname === "youtu.be" ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error("The supplied URL does not contain a valid YouTube video ID.");
  return id;
}

export function selectUnprocessed(videos: VideoMetadata[], processed: Set<string>, limit: number, requestedId?: string, force = false) {
  const candidates = requestedId ? videos.filter((video) => video.youtubeVideoId === requestedId) : videos;
  if (requestedId && !candidates.length) throw new Error("That video is not present in the channel's current RSS window. Add older lectures manually or temporarily provide their verified metadata.");
  return candidates.filter((video) => force || !processed.has(video.youtubeVideoId)).slice(0, limit);
}
