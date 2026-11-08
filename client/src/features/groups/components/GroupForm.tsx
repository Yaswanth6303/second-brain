import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Avatar } from "../../../components/ui/Avatar.tsx";
import { Field } from "../../../components/ui/Field.tsx";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { ApiError } from "../../../lib/api-client.ts";
import { refreshSocial } from "../../../lib/social-cache.ts";
import { useAuth } from "../../auth/index.ts";
import { useFriends } from "../../friends/index.ts";
import { createGroup, updateGroup } from "../api/groups.ts";
import type { Group } from "../types.ts";

export function GroupForm({ group, onClose }: { group?: Group; onClose: () => void }) {
  const me = useAuth().user!.id;
  const friends = useFriends().friends.map((f) => f.user);
  const [name, setName] = useState(group?.name ?? "");
  const [desc, setDesc] = useState(group?.desc ?? "");
  const [members, setMembers] = useState(
    group?.members.map((m) => m.id).filter((id) => id !== me) ?? [],
  );
  const [errors, setErrors] = useState<{ name?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  async function submit() {
    if (!name.trim()) return setErrors({ name: "Name the group." });
    if (!members.length) return toast("Pick at least one member");
    setBusy(true);
    try {
      const body = { name: name.trim(), desc: desc.trim(), members };
      if (group) {
        await updateGroup(group.id, body);
        toast("Group saved");
      } else {
        const g = await createGroup(body);
        toast("Group created");
        void navigate(`/groups/${g.id}`);
      }
      await refreshSocial(qc);
      onClose();
    } catch (e) {
      setErrors({
        form: e instanceof ApiError ? e.message : "Could not save the group. Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={group ? "Edit group" : "New group"}
      submitLabel={group ? "Save group" : "Create group"}
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Group name"
          maxLength={40}
          autoFocus
          value={name}
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="What is it for?"
          maxLength={90}
          placeholder="One line your friends will see"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <fieldset className="m-0 border-0 p-0">
          <legend className="label">Members</legend>
          <div className="border-line overflow-hidden rounded-[.6rem] border">
            {friends.map((f) => (
              <label
                key={f.id}
                className="border-line hover:bg-surface-2 flex cursor-pointer items-center gap-2 border-b px-3 py-2 last:border-b-0"
              >
                <input
                  type="checkbox"
                  className="check"
                  checked={members.includes(f.id)}
                  onChange={() =>
                    setMembers((l) =>
                      l.includes(f.id) ? l.filter((x) => x !== f.id) : [...l, f.id],
                    )
                  }
                />
                <Avatar name={f.name} hue={f.hue} size={26} />
                <span>{f.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {errors.form && (
          <div
            role="alert"
            className="bg-danger/10 text-danger rounded-[10px] px-3 py-2.5 text-[0.9rem]"
          >
            {errors.form}
          </div>
        )}
      </div>
    </Modal>
  );
}
