import { useQuery } from "@tanstack/react-query";
import * as api from "../api/library.ts";

export const ITEMS = ["items"];

// The whole library is loaded once; pages filter and count it locally.
export function useItems() {
  const { data, isPending } = useQuery({ queryKey: ITEMS, queryFn: api.listItems });
  return { items: data ?? [], isPending };
}
