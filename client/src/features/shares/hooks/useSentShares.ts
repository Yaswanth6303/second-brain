import { useQuery } from "@tanstack/react-query";
import { listSent } from "../api/shares.ts";

// `ready` matters for forms: until it is true, "nothing shared" just means "not loaded yet".
export function useSentSharesQuery() {
  const { data } = useQuery({ queryKey: ["shares-sent"], queryFn: listSent });
  return { shares: data ?? [], ready: !!data };
}

export const useSentShares = () => useSentSharesQuery().shares;
