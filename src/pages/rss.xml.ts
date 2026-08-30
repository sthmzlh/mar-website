import rss from "@astrojs/rss";
import { getLectures } from "../lib/lectures";

export async function GET(context: { site: URL }) {
  const lectures = await getLectures();
  return rss({
    title: "Mufti Abdul Raheem — Lecture Summaries",
    description: "Independent Urdu and English summaries of publicly available lectures by Mufti Abdul Raheem.",
    site: context.site,
    items: lectures.map((lecture) => ({
      title: lecture.data.urduTitle,
      description: lecture.data.shortUrduSummary,
      pubDate: lecture.data.publicationDate,
      link: `/bayan/${lecture.data.slug}/`,
      customData: `<language>ur</language>`,
    })),
  });
}
