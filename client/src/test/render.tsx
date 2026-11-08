import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, RouterProvider, createMemoryRouter } from "react-router";
import { Providers } from "../app/providers.tsx";
import { routes } from "../app/router.tsx";

// Renders the whole app at a URL, with fresh providers per test.
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return {
    router,
    ...render(
      <Providers>
        <RouterProvider router={router} />
      </Providers>,
    ),
  };
}

// Renders one piece of UI inside the app providers and a router.
export function renderWithProviders(ui: ReactNode) {
  return render(
    <Providers>
      <MemoryRouter>{ui}</MemoryRouter>
    </Providers>,
  );
}
