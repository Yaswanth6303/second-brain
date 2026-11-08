import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Field } from "../../../components/ui/Field.tsx";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { ApiError } from "../../../lib/api-client.ts";
import { refreshSocial } from "../../../lib/social-cache.ts";
import { sendRequest } from "../api/friends.ts";

export function AddFriendModal({ onClose }: { onClose: () => void }) {
  const [who, setWho] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  async function submit() {
    const w = who.trim();
    if (w.length < 3) return setError("Enter a username or an email address.");
    setBusy(true);
    try {
      const r = await sendRequest(w);
      toast(r.friend ? `${r.user.name} is now a friend` : `Request sent to ${w}`);
      await refreshSocial(qc);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not send the request. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Add a friend"
      submitLabel="Send request"
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
    >
      <Field
        label="Username or email"
        placeholder="@username or name@example.com"
        autoFocus
        value={who}
        error={error}
        onChange={(e) => (setWho(e.target.value), setError(undefined))}
      />
    </Modal>
  );
}
