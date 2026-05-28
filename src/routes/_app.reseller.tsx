import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/reseller")({
  beforeLoad: () => {
    throw redirect({ to: "/usuarios", replace: true });
  },
});
