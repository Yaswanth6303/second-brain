import type { Person } from "../friends/index.ts";

export type Group = {
  id: string;
  name: string;
  desc: string;
  owner: string;
  members: Person[];
  links: number;
};

export type GroupLink = {
  shareId: string;
  from: Person;
  url: string;
  title: string;
  type: string;
  mins: number;
  msg: string;
  at: string;
  done: { user: Person; at: string }[];
  mine: boolean;
  saved: boolean;
};
