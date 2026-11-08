import { useQuery } from "@tanstack/react-query";
import * as api from "../api/groups.ts";

export function useGroups() {
  const { data, isPending } = useQuery({ queryKey: ["groups"], queryFn: api.listGroups });
  return { groups: data ?? [], isPending };
}

export function useGroupPage(id: string) {
  return useQuery({ queryKey: ["group", id], queryFn: () => api.groupPage(id), retry: false });
}
