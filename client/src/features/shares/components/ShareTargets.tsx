import { Avatar, GroupAvatar } from "../../../components/ui/Avatar.tsx";
import { plural } from "../../../lib/format.ts";
import { type Person, useFriends } from "../../friends/index.ts";
import { useGroups } from "../../groups/index.ts";

type Props = {
  legend: string;
  friends: string[];
  groups: string[];
  // People already shared with by username who aren't friends, so they can be unticked too.
  extraPeople?: Person[];
  onChange: (next: { friends: string[]; groups: string[] }) => void;
  help?: string;
};

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
const row =
  "border-line flex cursor-pointer items-center gap-2 border-b px-3 py-2 last:border-b-0 hover:bg-surface-2";

export function ShareTargets({ legend, friends, groups, extraPeople = [], onChange, help }: Props) {
  const people = [...useFriends().friends.map((f) => f.user), ...extraPeople];
  const all = useGroups().groups;
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="label">{legend}</legend>
      {people.length || all.length ? (
        <div className="border-line overflow-hidden rounded-[.6rem] border">
          {people.map((u) => (
            <label key={u.id} className={row}>
              <input
                type="checkbox"
                className="check"
                checked={friends.includes(u.id)}
                onChange={() => onChange({ friends: toggle(friends, u.id), groups })}
              />
              <Avatar name={u.name} hue={u.hue} size={26} />
              <span className="min-w-0 flex-1">{u.name}</span>
              <span className="meta whitespace-nowrap">@{u.handle}</span>
            </label>
          ))}
          {all.map((g) => (
            <label key={g.id} className={row}>
              <input
                type="checkbox"
                className="check"
                checked={groups.includes(g.id)}
                onChange={() => onChange({ friends, groups: toggle(groups, g.id) })}
              />
              <GroupAvatar name={g.name} size={26} />
              <span className="min-w-0 flex-1">{g.name}</span>
              <span className="meta whitespace-nowrap">
                {plural(g.members.length, "person").replace("persons", "people")}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="note">Add a friend first, then you can put links on their watchlist.</p>
      )}
      {help && <div className="text-muted mt-1 text-[.875em]">{help}</div>}
    </fieldset>
  );
}
