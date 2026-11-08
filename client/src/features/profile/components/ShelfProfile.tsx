import { SideCard } from "../../../components/layout/RightRail.tsx";
import { domain } from "../../../lib/url.ts";
import { useAuth } from "../../auth/index.ts";
import { firstName } from "../../friends/index.ts";
import {
  Shelf,
  type ShelfLink,
  TypeIcon,
  dur,
  typeColor,
  typeDefs,
  typeOf,
} from "../../library/index.ts";

// What a friend sees on someone's profile: the shelf drawing and the list of links on it.
export function ShelfProfile({ name, shelf }: { name: string; shelf: ShelfLink[] }) {
  const defs = typeDefs(useAuth().user!.customTypes);
  return (
    <>
      <SideCard title={`${firstName({ name })}'s shelf`}>
        {shelf.length ? (
          <Shelf items={shelf} defs={defs} />
        ) : (
          <p className="note">Nothing here. The shelf is empty.</p>
        )}
      </SideCard>
      {shelf.length > 0 && (
        <div className="mt-4">
          <SideCard title="On the shelf">
            <ul className="side-list">
              {shelf.map((i) => {
                const t = typeOf(defs, i.type);
                return (
                  <li key={i.id} style={typeColor(t)}>
                    <TypeIcon t={t} />
                    <div className="min-w-0">
                      <a
                        className="item-title sm"
                        href={i.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {i.title}
                      </a>
                      <div className="meta">
                        {[domain(i.url), dur(i.mins, t)].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </SideCard>
        </div>
      )}
    </>
  );
}
