import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/revendas")({
  beforeLoad: () => {
    throw redirect({ to: "/usuarios", replace: true });
  },
});
