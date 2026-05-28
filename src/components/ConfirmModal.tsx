import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { ModalPortal } from "@/components/ModalPortal";

export function ConfirmModal({
  open,
  title = "Tem certeza?",
  description,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  destructive = true,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <ModalPortal>
      <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1115] shadow-2xl overflow-hidden"
          >
            <div className="flex items-start gap-4 p-5">
              <div
                className={`h-11 w-11 shrink-0 rounded-xl grid place-items-center border ${
                  destructive
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : "bg-amber-400/10 border-amber-400/30 text-amber-300"
                }`}
              >
                <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-base text-white">{title}</div>
                {description && (
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 -mt-1 -mr-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 bg-black/20">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  destructive
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500"
                    : "bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </ModalPortal>
  );
}
