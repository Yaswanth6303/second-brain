import { Link } from "react-router";
import { Avatar } from "../../../components/ui/Avatar.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { an, rel } from "../../../lib/format.ts";
import { domain } from "../../../lib/url.ts";
import { useAuth } from "../../auth/index.ts";
import { dur, typeColor, typeDefs, typeOf } from "../../library/index.ts";
import { useInboxActions } from "../hooks/useInbox.ts";
import type { InboxEntry } from "../types.ts";

export function InboxRow({ e }: { e: InboxEntry }) {
  const a = useInboxActions();
  const t = typeOf(typeDefs(useAuth().user!.customTypes), e.type);
  return (
    <li
      style={typeColor(t)}
      className="bg-surface border-line flex flex-wrap items-start gap-x-3.5 gap-y-2.5 rounded-xl border px-3.5 py-3"
    >
      <Avatar name={e.from.name} hue={e.from.hue} size={40} />
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-[3px]">
        <div className="meta">
          <b>{e.from.name}</b> sent {an(t.label)}
          {e.group && (
            <>
              {" "}
              to{" "}
              <Link className="linkish" to={`/groups/${e.group.id}`}>
                {e.group.name}
              </Link>
            </>
          )}{" "}
          · {rel(e.at)}
        </div>
        <a
          className="item-title"
          href={e.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => a.open(e.id)}
        >
          {e.title}
        </a>
        <div className="meta">{[domain(e.url), dur(e.mins, t)].filter(Boolean).join(" · ")}</div>
        {e.msg && <blockquote className="msg">{e.msg}</blockquote>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {e.state === "saved" ? (
          <span className="status static s-done">
            <i className="bi bi-check-circle-fill" />
            In your library
          </span>
        ) : (
          <Button size="sm" onClick={() => a.save(e.shareId)}>
            <i className="bi bi-plus-lg" /> Save to library
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => a.dismiss(e.id)}>
          Dismiss
        </Button>
      </div>
    </li>
  );
}
