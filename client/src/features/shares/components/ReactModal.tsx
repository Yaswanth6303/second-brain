import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { refreshSocial } from "../../../lib/social-cache.ts";
import { react } from "../api/shares.ts";

// After finishing a link someone shared: an optional line back to them.
export function ReactModal({ shareId, onClose }: { shareId: string; onClose: () => void }) {
  const [text, setText] = useState("");
  const qc = useQueryClient();
  const toast = useToast();
  async function submit() {
    if (text.trim()) {
      try {
        await react(shareId, text.trim());
        toast("Sent");
        await refreshSocial(qc);
      } catch {
        toast("Could not send it. Try again.");
        return;
      }
    }
    onClose();
  }
  return (
    <Modal
      title="What did you think?"
      submitLabel="Send"
      cancelLabel="Skip"
      onClose={onClose}
      onSubmit={submit}
    >
      <label className="label" htmlFor="react-text">
        A line for the person who shared it
      </label>
      <textarea
        id="react-text"
        className="field"
        rows={2}
        maxLength={280}
        autoFocus
        placeholder="The animation halfway through finally made it click."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </Modal>
  );
}
