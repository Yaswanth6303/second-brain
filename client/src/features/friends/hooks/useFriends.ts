import { useQuery } from "@tanstack/react-query";
import * as api from "../api/friends.ts";

export function useFriends() {
  const { data, isPending } = useQuery({ queryKey: ["friends"], queryFn: api.listFriends });
  return {
    friends: data?.friends ?? [],
    requests: data?.requests ?? [],
    sent: data?.sent ?? [],
    isPending,
  };
}

export function useFriendPage(id: string) {
  return useQuery({ queryKey: ["friend", id], queryFn: () => api.friendPage(id), retry: false });
}
