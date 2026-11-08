export type User = {
  id: string;
  name: string;
  handle: string;
  email: string;
  bio: string;
  hue: number;
  prefs: {
    who: "friends" | "anyone" | "nobody";
    status: boolean;
    pub: boolean;
    digest: boolean;
    dust: boolean;
  };
  createdAt: string;
  shelf: string[];
  collections: string[];
  customTypes: { key: string; label: string; plural: string; icon: string }[];
};
