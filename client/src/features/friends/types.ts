export type Person = { id: string; name: string; handle: string; bio: string; hue: number };

export const firstName = (p: { name: string }) => p.name.split(" ")[0]!;
