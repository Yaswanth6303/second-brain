import { RouterProvider, createBrowserRouter } from "react-router";
import { Providers } from "./providers.tsx";
import { routes } from "./router.tsx";

const router = createBrowserRouter(routes);

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
