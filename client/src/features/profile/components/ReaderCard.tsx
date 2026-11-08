import type { CSSProperties, ReactNode } from "react";
import { Avatar } from "../../../components/ui/Avatar.tsx";

type Props = {
  person: { name: string; handle: string; hue: number; bio?: string };
  email?: string;
  taste?: string;
  slip: [string, string | number][];
  actions?: ReactNode;
};

// The prototype's coloured "reader card" at the top of a profile.
export function ReaderCard({ person, email, taste, slip, actions }: Props) {
  return (
    <section className="reader-card" style={{ "--h": person.hue } as CSSProperties}>
      <div className="flex min-w-0 flex-wrap items-start gap-x-5 gap-y-4">
        <span className="rounded-full shadow-[0_0_0_3px_var(--color-card-line)]">
          <Avatar name={person.name} hue={person.hue} size={76} />
        </span>
        <div className="min-w-0 flex-[1_1_220px]">
          <h1 className="text-card-ink text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.1]">
            {person.name}
          </h1>
          <div className="text-card-dim mt-1 text-[.86rem] [overflow-wrap:anywhere]">
            @{person.handle}
            {email && ` · ${email}`}
          </div>
          {person.bio && <p className="mt-2.5 mb-0 max-w-[52ch]">{person.bio}</p>}
          {taste && <p className="text-card-dim mt-2 mb-0 max-w-[52ch] text-[.88rem]">{taste}</p>}
        </div>
      </div>
      <dl className="rc-slip">
        {slip.map(([l, v]) => (
          <div key={l}>
            <dt>{l}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {actions && (
        <div className="border-card-line col-span-full flex flex-wrap gap-2 border-t pt-4">
          {actions}
        </div>
      )}
    </section>
  );
}
