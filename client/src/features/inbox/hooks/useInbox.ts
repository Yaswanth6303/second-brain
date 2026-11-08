import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../components/ui/Toast.tsx";
import { refreshSocial } from "../../../lib/social-cache.ts";
import * as api from "../api/inbox.ts";

export function useInbox() {
  const { data, isPending } = useQuery({ queryKey: ["inbox"], queryFn: api.listInbox });
  return { entries: data ?? [], isPending };
}

export function useInboxActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const failed = () => toast("Could not save. Try again.");
  return {
    save(shareId: string) {
      api
        .saveShare(shareId)
        .then(() => (toast("Saved to your library"), refreshSocial(qc)), failed);
    },
    dismiss(id: string) {
      api.dismissEntry(id).then(() => (toast("Dismissed"), refreshSocial(qc)), failed);
    },
    // Fire and forget: following the link tells the sender it was opened.
    open(id: string) {
      void api.openEntry(id).then(
        () => refreshSocial(qc),
        () => {},
      );
    },
  };
}
