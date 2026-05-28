import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarBody, getBottomNavItems, type AppRole } from "@/components/Sidebar";
import { useMemo, useState } from "react";
import { useAppSession } from "@/contexts/AppSessionContext";

export function MobileNav() {
  const { profile } = useAppSession();
  const role = (profile?.role ?? "cliente") as AppRole;
  const [open, setOpen] = useState(false);
  const hiddenPaths = useMemo(() => getBottomNavItems(role).map((item) => item.to), [role]);

  if (role === "cliente") return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          data-handled="true"
          aria-label="Abrir menu"
          className="lg:hidden h-9 w-9 grid place-items-center rounded-[10px] btn-secondary"
        >
          <Menu className="h-[16px] w-[16px] text-[#A1A1AA]" strokeWidth={1.75} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-2 w-[280px] bg-transparent border-0 shadow-none"
      >
        <SheetTitle className="sr-only">Navegação</SheetTitle>
        <SidebarBody onNavigate={() => setOpen(false)} excludePaths={hiddenPaths} />
      </SheetContent>
    </Sheet>
  );
}
