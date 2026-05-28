import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Globe2, Home, RefreshCw, X } from "lucide-react";
import { useModalBackGuard } from "@/hooks/use-modal-back-guard";

type BrowserTab = {
  id: string;
  url: string;
  title: string;
};

function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function resolveUrl(value: string) {
  try {
    return new URL(value, window.location.href);
  } catch {
    return null;
  }
}

function shouldOpenInAppBrowser(url: URL) {
  return ["http:", "https:"].includes(url.protocol);
}

function tabTitle(url: URL) {
  return url.hostname.replace(/^www\./, "") || url.href;
}

export function InAppBrowserTabs() {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId) ?? null, [activeTabId, tabs]);
  const isOpen = activeTab !== null;

  const openTab = (value: string) => {
    const url = resolveUrl(value);
    if (!url || !shouldOpenInAppBrowser(url)) return false;

    const existing = tabs.find((tab) => tab.url === url.href);
    if (existing) {
      setActiveTabId(existing.id);
      return true;
    }

    const nextTab = { id: crypto.randomUUID(), url: url.href, title: tabTitle(url) };
    setTabs((current) => [...current, nextTab]);
    setActiveTabId(nextTab.id);
    return true;
  };

  const closeTab = (id: string) => {
    setTabs((current) => {
      const next = current.filter((tab) => tab.id !== id);
      if (activeTabId === id) setActiveTabId(next.at(-1)?.id ?? null);
      return next;
    });
  };

  const closeBrowser = () => setActiveTabId(null);
  useModalBackGuard(isOpen, closeBrowser);

  useEffect(() => {
    if (!isStandalonePwa()) return;

    const originalOpen = window.open;
    window.open = ((url?: string | URL) => {
      if (url && openTab(String(url))) return null;
      return originalOpen.call(window, url);
    }) as typeof window.open;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.dataset.handled === "true") return;

      const url = resolveUrl(target.href);
      if (!url || !shouldOpenInAppBrowser(url)) return;

      const opensNewContext = target.target === "_blank" || target.origin !== window.location.origin || target.dataset.pwaBrowser === "true";
      if (!opensNewContext) return;

      event.preventDefault();
      openTab(url.href);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      window.open = originalOpen;
      document.removeEventListener("click", onClick, true);
    };
  }, [tabs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#080a0d] text-white">
      <div className="flex min-h-12 items-center gap-2 border-b border-white/10 bg-[#101317] px-2">
        <button onClick={closeBrowser} className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white" title="Voltar ao app">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button onClick={closeBrowser} className="flex h-9 max-w-[160px] items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 text-xs font-semibold text-amber-100">
          <Home className="h-3.5 w-3.5" /> Bradox
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <button key={tab.id} onClick={() => setActiveTabId(tab.id)} className={`group flex h-9 max-w-[220px] shrink-0 items-center gap-2 rounded-lg border px-2.5 text-xs ${active ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"}`}>
                <Globe2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tab.title}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-400 hover:bg-white/10 hover:text-white"
                  title="Fechar aba"
                >
                  <X className="h-3 w-3" />
                </span>
              </button>
            );
          })}
        </div>
        {activeTab && (
          <>
            <button onClick={() => setActiveTabId(activeTab.id)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white" title="Recarregar">
              <RefreshCw className="h-4 w-4" />
            </button>
            <a href={activeTab.url} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white" title="Abrir fora do app">
              <ExternalLink className="h-4 w-4" />
            </a>
          </>
        )}
      </div>

      {activeTab && (
        <iframe
          key={`${activeTab.id}:${activeTab.url}`}
          src={activeTab.url}
          title={activeTab.title}
          className="min-h-0 flex-1 border-0 bg-white"
          sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"
        />
      )}
    </div>
  );
}