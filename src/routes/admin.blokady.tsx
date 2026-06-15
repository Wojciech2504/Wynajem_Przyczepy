import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/blokady")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/kalendarz" });
  },
});
