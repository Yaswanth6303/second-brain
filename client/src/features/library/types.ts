export type ItemStatus = "queue" | "progress" | "done";

export type Item = {
  id: string;
  url: string;
  title: string;
  type: string;
  tags: string[];
  mins: number;
  status: ItemStatus;
  fav: boolean;
  note: string;
  coll: string;
  remindAt: string | null;
  savedAt: string;
};

export type ItemInput = Pick<
  Item,
  "url" | "title" | "type" | "tags" | "mins" | "note" | "coll" | "remindAt"
>;

export type CustomType = { key: string; label: string; plural: string; icon: string };
export type TypeDef = CustomType & { verb: string; custom?: boolean };

export const BUILTIN_TYPES: Record<string, TypeDef> = {
  article: {
    key: "article",
    label: "Article",
    plural: "Articles",
    icon: "bi-file-text",
    verb: "read",
  },
  video: { key: "video", label: "Video", plural: "Videos", icon: "bi-play-btn", verb: "watch" },
  podcast: { key: "podcast", label: "Podcast", plural: "Podcasts", icon: "bi-mic", verb: "listen" },
  course: {
    key: "course",
    label: "Course",
    plural: "Courses",
    icon: "bi-mortarboard",
    verb: "study",
  },
  tool: { key: "tool", label: "Tool", plural: "Tools", icon: "bi-wrench-adjustable", verb: "try" },
};

export const STATUS: Record<ItemStatus, { label: string; icon: string }> = {
  queue: { label: "In queue", icon: "bi-circle" },
  progress: { label: "In progress", icon: "bi-circle-half" },
  done: { label: "Finished", icon: "bi-check-circle-fill" },
};

export const TYPE_ICONS = [
  "bi-book",
  "bi-newspaper",
  "bi-chat-quote",
  "bi-image",
  "bi-code-slash",
  "bi-music-note-beamed",
  "bi-cart",
  "bi-bookmark",
];

// Built-in types plus the user's own; an unknown key falls back to a plain bookmark.
export function typeDefs(custom: CustomType[]): Record<string, TypeDef> {
  return {
    ...BUILTIN_TYPES,
    ...Object.fromEntries(custom.map((t) => [t.key, { ...t, verb: "", custom: true }])),
  };
}

export const typeOf = (defs: Record<string, TypeDef>, key: string): TypeDef =>
  defs[key] ?? { key, label: "Link", plural: "Links", icon: "bi-bookmark", verb: "", custom: true };
