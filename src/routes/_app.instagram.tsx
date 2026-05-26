import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "@/components/Inbox";
export const Route = createFileRoute("/_app/instagram")({ component: () => <Inbox kind="instagram" /> });
