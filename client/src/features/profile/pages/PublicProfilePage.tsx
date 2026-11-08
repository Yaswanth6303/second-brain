import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { profileByHandle } from "../api/profile.ts";
import { ReaderCard } from "../components/ReaderCard.tsx";
import { ShelfProfile } from "../components/ShelfProfile.tsx";
import { monthYear } from "../lib/words.ts";

// /u/:handle — someone's card and shelf, if you are allowed to see it.
export function PublicProfilePage() {
  const { handle = "" } = useParams();
  const { data, isPending, isError } = useQuery({
    queryKey: ["profile", handle],
    queryFn: () => profileByHandle(handle),
    retry: false,
  });
  if (isPending) return null;
  if (isError || !data)
    return (
      <EmptyState
        icon="bi-person"
        title="Profile not found"
        text="It may not exist, or its shelf is only for friends."
        action={
          <Link className="linkish" to="/friends">
            Your friends
          </Link>
        }
      />
    );
  return (
    <>
      <ReaderCard
        person={data.user}
        slip={[
          ["Member since", monthYear(data.since)],
          ["On the shelf", data.shelf.length],
        ]}
      />
      <ShelfProfile name={data.user.name} shelf={data.shelf} />
    </>
  );
}
