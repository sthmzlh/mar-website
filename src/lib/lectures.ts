import { getCollection, type CollectionEntry } from "astro:content";

export type Lecture = CollectionEntry<"lectures">;

export async function getLectures() {
  const entries = await getCollection("lectures", ({ data }) => !data.draft);
  return entries.sort((a, b) => b.data.publicationDate.valueOf() - a.data.publicationDate.valueOf());
}

export function formatDate(date: Date, locale = "ur-PK") {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "topic";
}

export function topicPairs(lecture: Lecture) {
  const english = lecture.data.topicsEnglish;
  const urdu = lecture.data.topicsUrdu;
  return english.map((nameEnglish, index) => ({
    nameEnglish,
    nameUrdu: urdu[index] ?? nameEnglish,
    slug: slugify(nameEnglish),
  }));
}

export function getAllTopics(lectures: Lecture[]) {
  const map = new Map<string, { slug: string; nameEnglish: string; nameUrdu: string; count: number }>();
  for (const lecture of lectures) {
    for (const topic of topicPairs(lecture)) {
      const current = map.get(topic.slug);
      map.set(topic.slug, current ? { ...current, count: current.count + 1 } : { ...topic, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => a.nameEnglish.localeCompare(b.nameEnglish));
}
