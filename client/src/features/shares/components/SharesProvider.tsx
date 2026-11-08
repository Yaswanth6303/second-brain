import { type ReactNode, createContext, useContext, useState } from "react";
import type { Item } from "../../library/index.ts";
import type { Target } from "../types.ts";
import { PickModal } from "./PickModal.tsx";
import { ReactModal } from "./ReactModal.tsx";
import { ShareModal } from "./ShareModal.tsx";

type Open =
  | { kind: "share"; item: Item }
  | { kind: "pick"; target: Target }
  | { kind: "react"; shareId: string };
type Api = {
  openShare: (item: Item) => void;
  openPick: (t: Target) => void;
  askReact: (shareId: string) => void;
};

const SharesContext = createContext<Api | null>(null);

// Owns the share, pick and reaction dialogs so any page can open them.
export function SharesProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  const close = () => setOpen(null);
  const api: Api = {
    openShare: (item) => setOpen({ kind: "share", item }),
    openPick: (target) => setOpen({ kind: "pick", target }),
    askReact: (shareId) => setOpen({ kind: "react", shareId }),
  };
  return (
    <SharesContext.Provider value={api}>
      {children}
      {open?.kind === "share" && <ShareModal item={open.item} onClose={close} />}
      {open?.kind === "pick" && <PickModal target={open.target} onClose={close} />}
      {open?.kind === "react" && <ReactModal shareId={open.shareId} onClose={close} />}
    </SharesContext.Provider>
  );
}

export function useShares(): Api {
  const ctx = useContext(SharesContext);
  if (!ctx) throw new Error("useShares needs <SharesProvider>");
  return ctx;
}
