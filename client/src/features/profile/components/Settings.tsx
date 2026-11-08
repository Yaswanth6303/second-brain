import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useId, useState } from "react";
import { useNavigate } from "react-router";
import { SideCard } from "../../../components/layout/RightRail.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { Field } from "../../../components/ui/Field.tsx";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { ApiError } from "../../../lib/api-client.ts";
import { ME, useAuth } from "../../auth/index.ts";
import {
  deleteAccount,
  exportLibrary,
  type Prefs,
  updatePrefs,
  updateProfile,
} from "../api/profile.ts";
import { CARD_HUES } from "../lib/words.ts";

function Switch({
  checked,
  label,
  help,
  onChange,
}: {
  checked: boolean;
  label: string;
  help: string;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2.5">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="switch text-base"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
      <div className="text-muted pl-[2.625rem] text-[.875em]">{help}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <SideCard title={title}>{children}</SideCard>;
}

export function Settings({ onChooseShelf }: { onChooseShelf: () => void }) {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const whoId = useId();
  const bioId = useId();
  const [form, setForm] = useState({
    name: user!.name,
    handle: user!.handle,
    email: user!.email,
    bio: user!.bio,
    hue: user!.hue,
  });
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [deleting, setDeleting] = useState(false);
  // A new email can be used to reset the password, so the server asks for the current one.
  const emailChanged = form.email.trim().toLowerCase() !== user!.email;
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  async function saveProfile() {
    try {
      const u = await updateProfile(emailChanged ? { ...form, currentPassword: password } : form);
      setUser(u);
      // Show what the server stored (e.g. a lowercased username), not what was typed.
      setForm({ name: u.name, handle: u.handle, email: u.email, bio: u.bio, hue: u.hue });
      setPassword("");
      setErrors({});
      toast("Profile saved");
    } catch (e) {
      if (!(e instanceof ApiError)) return setErrors({ form: "Could not save. Try again." });
      // Field errors show under their field; anything else needs the message, or nothing would appear.
      const shown = ["name", "handle", "email", "currentPassword"];
      const fields = e.fields ?? {};
      setErrors(Object.keys(fields).some((k) => shown.includes(k)) ? fields : { form: e.message });
    }
  }

  function pref(p: Partial<Prefs>) {
    updatePrefs(p).then(
      (u) => (setUser(u), toast("Setting saved")),
      () => toast("Could not save. Try again."),
    );
  }

  async function copyExport() {
    try {
      const data = await exportLibrary();
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast("Copied");
    } catch {
      toast("Copy is blocked here. Try again from a normal browser tab.");
    }
  }

  const p = user!.prefs;
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-start gap-4">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void saveProfile();
        }}
      >
        <Card title="Profile">
          <Field
            label="Full name"
            value={form.name}
            error={errors.name}
            onChange={(e) => set({ name: e.target.value })}
          />
          <Field
            label="Username"
            prefix="@"
            value={form.handle}
            error={errors.handle}
            onChange={(e) => set({ handle: e.target.value })}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(e) => set({ email: e.target.value })}
          />
          {emailChanged && (
            <Field
              label="Current password"
              type="password"
              autoComplete="current-password"
              hint="Needed to change your email."
              value={password}
              error={errors.currentPassword}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          <div>
            <label className="label" htmlFor={bioId}>
              Bio
            </label>
            <textarea
              id={bioId}
              className="field"
              rows={2}
              maxLength={140}
              value={form.bio}
              onChange={(e) => set({ bio: e.target.value })}
            />
          </div>
          <fieldset className="m-0 border-0 p-0">
            <legend className="label">Card colour</legend>
            <div className="flex flex-wrap gap-2">
              {CARD_HUES.map((h, k) => (
                <button
                  key={h}
                  type="button"
                  aria-label={`Card colour ${k + 1}`}
                  aria-pressed={form.hue === h}
                  onClick={() => set({ hue: h })}
                  className={`border-surface size-8 rounded-full border-2 p-0 ${form.hue === h ? "shadow-[0_0_0_2px_var(--color-ink)]" : "shadow-[0_0_0_1px_var(--color-line)]"}`}
                  style={{ background: `hsl(${h} 40% 22%)` }}
                />
              ))}
            </div>
          </fieldset>
          {errors.form && (
            <div role="alert" className="text-danger text-[.9rem]">
              {errors.form}
            </div>
          )}
          <div>
            <Button type="submit">Save profile</Button>
          </div>
        </Card>
      </form>

      <Card title="Sharing and privacy">
        <div>
          <label className="label" htmlFor={whoId}>
            Who can send me links
          </label>
          <select
            id={whoId}
            className="field"
            value={p.who}
            onChange={(e) => pref({ who: e.target.value as Prefs["who"] })}
          >
            <option value="friends">Friends only</option>
            <option value="anyone">Anyone who knows my username</option>
            <option value="nobody">Nobody</option>
          </select>
        </div>
        <Switch
          checked={p.status}
          label="Tell friends when I open their links"
          help="Friends see Opened and Finished on links they sent you. It does not touch your shelf."
          onChange={(v) => pref({ status: v })}
        />
        <Switch
          checked={p.pub}
          label="Let people who are not friends see my shelf"
          help="Off: only friends can open it. On: anyone with your profile link can."
          onChange={(v) => pref({ pub: v })}
        />
        <div>
          <Button variant="outline" size="sm" onClick={onChooseShelf}>
            <i className="bi bi-bookshelf" /> Choose what is on my shelf
          </Button>
        </div>
        <h2 className="mt-2">Reminders</h2>
        <Switch
          checked={p.digest}
          label="Weekly digest by email"
          help="A Sunday summary of what is still in your queue."
          onChange={(v) => pref({ digest: v })}
        />
        <Switch
          checked={p.dust}
          label="Flag links older than 30 days"
          help="Shows them under Reminders so you finish them or let them go."
          onChange={(v) => pref({ dust: v })}
        />
      </Card>

      <Card title="Your data and account">
        <p className="note">Copy your whole library as JSON to back it up or move it elsewhere.</p>
        <div>
          <Button variant="outline" onClick={() => void copyExport()}>
            <i className="bi bi-clipboard" /> Copy library as JSON
          </Button>
        </div>
        <div>
          <Button variant="outline" onClick={() => void logout().then(() => navigate("/login"))}>
            <i className="bi bi-box-arrow-right" /> Log out
          </Button>
        </div>
        <div>
          <Button variant="outline" className="text-danger!" onClick={() => setDeleting(true)}>
            <i className="bi bi-trash" /> Delete account
          </Button>
        </div>
      </Card>

      {deleting && (
        <Modal
          title="Delete your account?"
          submitLabel="Delete account"
          danger
          onClose={() => setDeleting(false)}
          onSubmit={async () => {
            try {
              await deleteAccount();
              qc.clear();
              qc.setQueryData(ME, null);
              void navigate("/signup");
            } catch {
              toast("Could not delete the account. Try again.");
            }
          }}
        >
          <p className="m-0">
            Your library, watchlists and groups are removed for good. Friends lose the links you
            shared with them.
          </p>
        </Modal>
      )}
    </div>
  );
}
