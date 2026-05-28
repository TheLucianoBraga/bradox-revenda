import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalBackGuard } from "@/hooks/use-modal-back-guard";

export function ModalPortal({ children, open = false, onClose }: { children: ReactNode; open?: boolean; onClose?: () => void }) {
  useModalBackGuard(open, onClose);

  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}