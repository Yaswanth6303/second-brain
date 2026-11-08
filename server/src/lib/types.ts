// Link types every user has; custom types are stored per user.
export const BUILTIN_TYPES = ['article', 'video', 'podcast', 'course', 'tool'] as const;

export const BUILTIN_LABELS: Record<string, [label: string, plural: string]> = {
  article: ['Article', 'Articles'],
  video: ['Video', 'Videos'],
  podcast: ['Podcast', 'Podcasts'],
  course: ['Course', 'Courses'],
  tool: ['Tool', 'Tools'],
};

export const TYPE_ICONS = [
  'bi-book',
  'bi-newspaper',
  'bi-chat-quote',
  'bi-image',
  'bi-code-slash',
  'bi-music-note-beamed',
  'bi-cart',
  'bi-bookmark',
];
