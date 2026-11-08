import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/Button.tsx";
import { Dropdown } from "../../components/ui/Dropdown.tsx";
import { api } from "../../lib/api-client.ts";
import { rel } from "../../lib/format.ts";

type Note = {
  kind: "request" | "inbox" | "opened" | "finished" | "reminder";
  at: string;
  text: string;
  link: string;
};

const ICONS: Record<Note["kind"], string> = {
  request: "bi-person-plus",
  inbox: "bi-send",
  opened: "bi-eye",
  finished: "bi-check-circle",
  reminder: "bi-bell",
};

function Panel({ items, close }: { items: Note[]; close: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [now] = useState(Date.now);
  // Opening the bell counts as seeing everything in it.
  useEffect(() => {
    void api("/notifications/seen", { method: "POST" }).then(() =>
      qc.invalidateQueries({ queryKey: ["notifications"] }),
    );
  }, [qc]);
  return (
    <>
      <h2 className="px-2 pt-2 pb-1">Notifications</h2>
      {items.length ? (
        <ul className="m-0 list-none p-0">
          {items.map((n, k) => (
            <li key={k}>
              <Link
                to={n.link}
                onClick={close}
                className="text-ink hover:bg-surface-2 flex gap-2.5 rounded-lg p-2 text-[.86rem] leading-[1.35] no-underline"
              >
                <i className={`bi ${ICONS[n.kind]} text-brand mt-0.5`} />
                <div>
                  {n.text}
                  <div className="meta">
                    {n.kind === "reminder" && Date.parse(n.at) > now ? "coming up" : rel(n.at)}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta px-2 pb-2">Nothing new yet.</p>
      )}
      <div className="p-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => (close(), void navigate("/inbox"))}
        >
          Open Shared with me
        </Button>
      </div>
    </>
  );
}

export function Bell() {
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ items: Note[]; unseen: boolean }>("/notifications"),
  });
  return (
    <Dropdown
      label={data?.unseen ? "Notifications, new" : "Notifications"}
      className="w-[min(330px,calc(100vw-32px))] p-1.5"
      trigger={
        <>
          <i className="bi bi-bell" />
          {data?.unseen && (
            <span className="bg-danger absolute top-1.5 right-[7px] size-2 rounded-full shadow-[0_0_0_2px_var(--color-bg)]" />
          )}
        </>
      }
    >
      {(close) => <Panel items={data?.items ?? []} close={close} />}
    </Dropdown>
  );
}
