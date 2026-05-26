import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "@/components/Inbox";
export const Route = createFileRoute("/_app/whatsapp")({ component: () => <Inbox kind="whatsapp" /> });
