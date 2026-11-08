// Demo data ported from the original prototype. Run with `bun run seed`.
// Only the demo accounts below are replaced; every other account is left alone.
import mongoose from 'mongoose';
import { env } from './config/env.ts';
import { connectDb } from './db/connect.ts';
import { Friendship, pairKey } from './models/Friendship.ts';
import { Group } from './models/Group.ts';
import { InboxEntry } from './models/InboxEntry.ts';
import { Item } from './models/Item.ts';
import { Share } from './models/Share.ts';
import { User } from './models/User.ts';
import { signup } from './modules/auth/auth.service.ts';
import { createShares, saveShare } from './modules/shares/shares.service.ts';
import { deleteAccount } from './modules/users/users.service.ts';

export const DEMO_PASSWORD = 'demo-library-2026';

const PEOPLE = {
  aarav: {
    name: 'Aarav Mehta',
    email: 'aarav@example.com',
    hue: 168,
    bio: 'Product designer in Pune. Saves more than he finishes.',
  },
  priyan: { name: 'Priya Nair', email: 'priya@example.com', hue: 12, bio: '' },
  rohanv: { name: 'Rohan Verma', email: 'rohan@example.com', hue: 212, bio: '' },
  'sneha.i': { name: 'Sneha Iyer', email: 'sneha@example.com', hue: 282, bio: '' },
  kabirs: { name: 'Kabir Shah', email: 'kabir@example.com', hue: 140, bio: '' },
  meeraj: { name: 'Meera Joshi', email: 'meera@example.com', hue: 38, bio: '' },
  devm: { name: 'Dev Malhotra', email: 'dev@example.com', hue: 330, bio: '' },
};
type Handle = keyof typeof PEOPLE;
export const DEMO_HANDLES = Object.keys(PEOPLE) as Handle[];

const H = 3600e3;
const ago = (d: number, h = 0) => new Date(Date.now() - d * 24 * H - h * H);

type Link = [
  key: string,
  url: string,
  title: string,
  type: string,
  tags: string[],
  mins: number,
  status: 'queue' | 'progress' | 'done',
  d: number,
  h: number,
  extra?: Record<string, unknown>,
];

// Aarav's library, as in the prototype.
const LINKS: Link[] = [
  [
    'i1',
    'https://paulgraham.com/greatwork.html',
    'How to Do Great Work',
    'article',
    ['career', 'essays'],
    45,
    'queue',
    0,
    3,
    { fav: true, coll: 'Career', note: 'Priya keeps quoting this. Read before Friday.' },
  ],
  [
    'i12',
    'https://getbootstrap.com/docs/5.3/',
    'Bootstrap 5.3 documentation',
    'tool',
    ['frontend', 'reference'],
    0,
    'queue',
    0,
    9,
    { coll: 'Design and code' },
  ],
  [
    'i2',
    'https://www.youtube.com/watch?v=aircAruvnKk',
    'But what is a neural network?',
    'video',
    ['ai', 'math'],
    19,
    'done',
    1,
    5,
    { coll: 'AI and ML', note: 'Best visual explanation of layers and weights I have seen.' },
  ],
  [
    'i3',
    'https://arxiv.org/abs/1706.03762',
    'Attention Is All You Need',
    'article',
    ['ai', 'papers'],
    40,
    'progress',
    2,
    1,
    { coll: 'AI and ML', note: 'Stopped at section 3.2, multi-head attention.' },
  ],
  [
    'i5',
    'https://www.ted.com/talks/tim_urban_inside_the_mind_of_a_master_procrastinator',
    'Inside the mind of a master procrastinator',
    'video',
    ['productivity'],
    14,
    'done',
    3,
    6,
    { fav: true },
  ],
  [
    'i6',
    'https://www.youtube.com/watch?v=UF8uR6Z6KLc',
    "Steve Jobs' 2005 Stanford commencement address",
    'video',
    ['career', 'speeches'],
    15,
    'queue',
    4,
    2,
    { coll: 'Career' },
  ],
  [
    'i7',
    'https://www.acquired.fm/episodes',
    'Acquired podcast: all episodes',
    'podcast',
    ['business', 'startups'],
    180,
    'progress',
    5,
    4,
    { coll: 'Listen later', note: 'Start with the Nvidia episodes.' },
  ],
  [
    'i8',
    'https://www.lennysnewsletter.com/podcast',
    "Lenny's Podcast",
    'podcast',
    ['product'],
    75,
    'queue',
    6,
    2,
    { coll: 'Listen later' },
  ],
  [
    'i9',
    'https://tim.blog/podcast/',
    'The Tim Ferriss Show',
    'podcast',
    ['interviews'],
    120,
    'queue',
    9,
    3,
    { coll: 'Listen later' },
  ],
  [
    'i10',
    'https://zerodha.com/varsity/',
    'Zerodha Varsity: Introduction to Stock Markets',
    'course',
    ['money', 'investing'],
    300,
    'progress',
    12,
    1,
    { coll: 'Money', fav: true, note: 'Module 1 done. Keep going one chapter a day.' },
  ],
  [
    'i11',
    'https://fs.blog/mental-models/',
    'Mental Models: The Best Way to Make Intelligent Decisions',
    'article',
    ['thinking'],
    30,
    'done',
    15,
    7,
  ],
  [
    'i13',
    'https://www.refactoringui.com/',
    'Refactoring UI',
    'tool',
    ['design', 'reference'],
    0,
    'queue',
    20,
    2,
    { coll: 'Design and code' },
  ],
  [
    'i4',
    'https://waitbutwhy.com/2015/01/artificial-intelligence-revolution-1.html',
    'The AI Revolution: The Road to Superintelligence',
    'article',
    ['ai', 'longread'],
    60,
    'queue',
    34,
    0,
    { coll: 'AI and ML' },
  ],
];

// What Aarav shared, and how far each person got.
type Out = {
  to: Handle | 'g1' | 'g2';
  d: number;
  h?: number;
  seen?: 'opened' | 'done';
  react?: string;
  done?: Handle[];
};
const SHARED: Record<string, Out[]> = {
  i1: [
    { to: 'priyan', d: 0, h: 2, seen: 'opened' },
    { to: 'g2', d: 0, h: 2, done: ['sneha.i'] },
  ],
  i2: [
    {
      to: 'rohanv',
      d: 1,
      h: 2,
      seen: 'done',
      react: 'The animation halfway through finally made it click.',
    },
  ],
  i5: [{ to: 'g1', d: 3, h: 1, done: ['priyan', 'kabirs'] }],
  i6: [
    { to: 'g1', d: 2, h: 3, done: ['rohanv'] },
    { to: 'meeraj', d: 4 },
  ],
  i7: [{ to: 'sneha.i', d: 5, h: 1 }],
  i8: [{ to: 'g2', d: 6, done: ['meeraj', 'rohanv'] }],
  i10: [{ to: 'kabirs', d: 11, seen: 'opened' }],
  i11: [
    { to: 'meeraj', d: 14, seen: 'done', react: 'Sent this to my whole team.' },
    { to: 'priyan', d: 14, seen: 'done' },
  ],
  i13: [{ to: 'priyan', d: 19 }],
};

// Links friends sent Aarav.
const RECEIVED: {
  from: Handle;
  to: Handle | 'g1' | 'g2';
  url: string;
  title: string;
  type: string;
  mins: number;
  msg: string;
  d: number;
  h: number;
  saved?: boolean;
}[] = [
  {
    from: 'priyan',
    to: 'aarav',
    url: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
    title: 'The essence of calculus',
    type: 'video',
    mins: 17,
    msg: 'Same channel as the neural network one. Watch this first.',
    d: 0,
    h: 1,
  },
  {
    from: 'rohanv',
    to: 'g1',
    url: 'https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action',
    title: 'How great leaders inspire action',
    type: 'video',
    mins: 18,
    msg: 'My pick for this weekend.',
    d: 1,
    h: 3,
  },
  {
    from: 'sneha.i',
    to: 'g2',
    url: 'https://www.joelonsoftware.com/2000/08/09/the-joel-test-12-steps-to-better-code/',
    title: 'The Joel Test: 12 Steps to Better Code',
    type: 'article',
    mins: 12,
    msg: '',
    d: 2,
    h: 5,
  },
  {
    from: 'kabirs',
    to: 'aarav',
    url: 'https://www.investopedia.com/terms/c/compoundinterest.asp',
    title: 'Compound interest: formula and examples',
    type: 'article',
    mins: 10,
    msg: 'Read this before chapter 3 of Varsity.',
    d: 4,
    h: 2,
    saved: true,
  },
  {
    from: 'meeraj',
    to: 'aarav',
    url: 'https://www.npr.org/podcasts/510313/how-i-built-this',
    title: 'How I Built This',
    type: 'podcast',
    mins: 60,
    msg: 'Good for your commute.',
    d: 6,
    h: 8,
  },
];

// Friends' own shelves.
const SHELVES: Partial<
  Record<
    Handle,
    [url: string, title: string, type: string, mins: number, fav: boolean, d: number][]
  >
> = {
  priyan: [
    [
      'https://jalammar.github.io/illustrated-transformer/',
      'The Illustrated Transformer',
      'article',
      25,
      true,
      8,
    ],
    [
      'https://www.khanacademy.org/math/linear-algebra',
      'Khan Academy: Linear algebra',
      'course',
      240,
      false,
      40,
    ],
  ],
  'sneha.i': [
    [
      'https://basecamp.com/shapeup',
      'Shape Up: Stop Running in Circles and Ship Work that Matters',
      'article',
      180,
      true,
      22,
    ],
  ],
  kabirs: [
    [
      'https://www.berkshirehathaway.com/letters/letters.html',
      'Berkshire Hathaway shareholder letters',
      'article',
      90,
      true,
      30,
    ],
  ],
};

// Mongoose stamps documents with "now"; demo data wants realistic ages.
const backdate = (model: mongoose.Model<never>, id: unknown, at: Date) =>
  model.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(String(id)) },
    { $set: { createdAt: at, updatedAt: at } },
  );

export async function seed() {
  // An account is demo data only if both its username and email are the demo ones.
  // Anything else holding a demo username or email is a real account: stop before deleting.
  const emails = DEMO_HANDLES.map((h) => PEOPLE[h].email);
  const found = await User.find({
    $or: [{ handle: { $in: DEMO_HANDLES } }, { email: { $in: emails } }],
  });
  const real = found.filter((u) => PEOPLE[u.handle as Handle]?.email !== u.email);
  if (real.length) {
    const who = real.map((u) => `@${u.handle} (${u.email})`).join(', ');
    throw new Error(
      `Seed stopped: ${who} uses a demo username or email but is not a demo account. Nothing was changed.`,
    );
  }
  for (const u of found) await deleteAccount(u.id as string);

  const ids = {} as Record<Handle, string>;
  for (const handle of DEMO_HANDLES) {
    const p = PEOPLE[handle];
    const user = await signup({ name: p.name, handle, email: p.email, password: DEMO_PASSWORD });
    user.set({ hue: p.hue, bio: p.bio });
    await user.save();
    await backdate(User as never, user.id, ago(670));
    ids[handle] = user.id as string;
  }
  const me = ids.aarav;

  const friend = async (a: Handle, b: Handle, d: number, accepted = true) => {
    const f = await Friendship.create({
      requester: ids[a],
      recipient: ids[b],
      pair: pairKey(ids[a], ids[b]),
      status: accepted ? 'accepted' : 'pending',
      acceptedAt: accepted ? ago(d) : undefined,
    });
    await backdate(Friendship as never, f.id, ago(d));
  };
  await friend('aarav', 'priyan', 660);
  await friend('aarav', 'rohanv', 600);
  await friend('sneha.i', 'aarav', 510);
  await friend('aarav', 'kabirs', 360);
  await friend('meeraj', 'aarav', 270);
  // Friends of friends, for group members who are not Aarav's friends.
  await friend('rohanv', 'sneha.i', 100);
  await friend('rohanv', 'meeraj', 100);
  await friend('devm', 'aarav', 0, false);

  const groups = {
    g1: await Group.create({
      owner: me,
      name: 'Weekend Watch Club',
      desc: 'One talk or long video every weekend, then we argue about it.',
      members: [me, ids.priyan, ids.rohanv, ids.kabirs],
    }),
    g2: await Group.create({
      owner: me,
      name: 'Product Reads',
      desc: 'Articles and podcasts on building products.',
      members: [me, ids['sneha.i'], ids.meeraj, ids.rohanv],
    }),
  };
  const target = (to: Handle | 'g1' | 'g2') =>
    to === 'g1' || to === 'g2'
      ? { friends: [], groups: [groups[to].id as string] }
      : { friends: [ids[to]], groups: [] };

  const items: Record<string, string> = {};
  for (const [key, url, title, type, tags, mins, status, d, h, extra = {}] of LINKS) {
    const it = await Item.create({ owner: me, url, title, type, tags, mins, status, ...extra });
    await backdate(Item as never, it.id, ago(d, h));
    items[key] = it.id as string;
  }
  const remind = ago(-2);
  remind.setHours(9, 0, 0, 0);
  await Item.updateOne({ _id: items.i1 }, { remindAt: remind });
  await User.updateOne(
    { _id: me },
    {
      collections: ['AI and ML', 'Career', 'Money', 'Design and code', 'Listen later'],
      shelf: ['i11', 'i2', 'i10', 'i5', 'i1'].map((k) => items[k]),
    },
  );

  for (const [key, outs] of Object.entries(SHARED)) {
    for (const o of outs) {
      const [share] = await createShares(me, {
        itemIds: [items[key]!],
        ...target(o.to),
        handles: [],
        msg: '',
      });
      const at = ago(o.d, o.h ?? 0);
      share!.set({
        seen: o.seen ?? 'new',
        seenAt: o.seen ? at : undefined,
        react: o.react ?? '',
        done: (o.done ?? []).map((h) => ({ user: ids[h], at })),
      });
      await share!.save();
      await backdate(Share as never, share!.id, at);
      for (const e of await InboxEntry.find({ share: share!.id }))
        await backdate(InboxEntry as never, e.id, at);
    }
  }

  for (const r of RECEIVED) {
    const it = await Item.create({
      owner: ids[r.from],
      url: r.url,
      title: r.title,
      type: r.type,
      mins: r.mins,
    });
    const [share] = await createShares(ids[r.from], {
      itemIds: [it.id as string],
      ...target(r.to),
      handles: [],
      msg: r.msg,
    });
    const at = ago(r.d, r.h);
    await backdate(Share as never, share!.id, at);
    for (const e of await InboxEntry.find({ share: share!.id }))
      await backdate(InboxEntry as never, e.id, at);
    if (r.saved) await saveShare(me, share!.id as string);
  }

  for (const [handle, links] of Object.entries(SHELVES)) {
    const owner = ids[handle as Handle];
    const shelf: string[] = [];
    for (const [url, title, type, mins, fav, d] of links!) {
      const it = await Item.create({ owner, url, title, type, mins, fav, status: 'done' });
      await backdate(Item as never, it.id, ago(d));
      shelf.push(it.id as string);
    }
    await User.updateOne({ _id: owner }, { shelf });
  }

  return {
    users: DEMO_HANDLES.length,
    items: await Item.countDocuments({ owner: { $in: Object.values(ids) } }),
  };
}

if (import.meta.main) {
  await connectDb(env.MONGO_URI);
  const r = await seed();
  console.log(
    `Seeded ${r.users} demo users and ${r.items} links. Log in as aarav@example.com with password "${DEMO_PASSWORD}".`,
  );
  await mongoose.disconnect();
}
