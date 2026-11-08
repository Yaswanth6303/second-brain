import { Navigate, type RouteObject } from "react-router";
import { AppShell } from "../components/layout/AppShell.tsx";
import {
  ForgotPage,
  GuestOnly,
  LoginPage,
  RequireAuth,
  ResetPage,
  SignupPage,
} from "../features/auth/index.ts";
import { FriendPage, FriendsPage } from "../features/friends/index.ts";
import { GroupPage, GroupsPage } from "../features/groups/index.ts";
import { InboxPage } from "../features/inbox/index.ts";
import { LibraryPage } from "../features/library/index.ts";
import { ProfilePage, PublicProfilePage } from "../features/profile/index.ts";

export const routes: RouteObject[] = [
  {
    element: <GuestOnly />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/forgot", element: <ForgotPage /> },
    ],
  },
  { path: "/reset/:token", element: <ResetPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/library", element: <LibraryPage /> },
          { path: "/inbox", element: <InboxPage /> },
          { path: "/friends", element: <FriendsPage /> },
          { path: "/friends/:id", element: <FriendPage /> },
          { path: "/groups", element: <GroupsPage /> },
          { path: "/groups/:id", element: <GroupPage /> },
          { path: "/profile/:tab?", element: <ProfilePage /> },
          { path: "/u/:handle", element: <PublicProfilePage /> },
          { path: "*", element: <Navigate to="/library" replace /> },
        ],
      },
    ],
  },
];
