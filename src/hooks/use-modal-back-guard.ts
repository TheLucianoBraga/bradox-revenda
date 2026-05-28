import { useEffect, useRef } from "react";

const MODAL_HISTORY_KEY = "__bradoxModalGuard";

export function useModalBackGuard(open: boolean, onClose?: () => void) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || !onCloseRef.current || typeof window === "undefined") return;

    const marker = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const previousState = window.history.state;
    const baseState = previousState && typeof previousState === "object" ? previousState : {};
    let closedByBackButton = false;

    window.history.pushState({ ...baseState, [MODAL_HISTORY_KEY]: marker }, "", window.location.href);

    const onPopState = (event: PopStateEvent) => {
      const nextState = event.state as Record<string, unknown> | null;
      if (nextState?.[MODAL_HISTORY_KEY] === marker) return;
      closedByBackButton = true;
      onCloseRef.current?.();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      const currentState = window.history.state as Record<string, unknown> | null;
      if (!closedByBackButton && currentState?.[MODAL_HISTORY_KEY] === marker) {
        window.history.back();
      }
    };
  }, [open]);
}