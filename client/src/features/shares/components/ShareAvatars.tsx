import { Avatar, GroupAvatar } from "../../../components/ui/Avatar.tsx";
import { useSentShares } from "../hooks/useSentShares.ts";

// Up to three faces of who has this link on their watchlist.
export function ShareAvatars({ itemId }: { itemId: string }) {
  const shares = useSentShares().filter((s) => s.item === itemId);
  if (!shares.length) return null;
  return (
    <>
      <span className="av-stack">
        {shares
          .slice(0, 3)
          .map((s) =>
            s.kind === "friend" && "hue" in s.to ? (
              <Avatar key={s.id} name={s.to.name} hue={s.to.hue} size={24} />
            ) : (
              <GroupAvatar key={s.id} name={s.to.name} size={24} />
            ),
          )}
      </span>
      {shares.length > 3 && <span className="n">+{shares.length - 3}</span>}
    </>
  );
}
