import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered, Link2, Strikethrough, Heading2, Undo2, Redo2 } from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export function RichTextEditor({ value, onChange, placeholder, minHeight = 160 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value only when it diverges from the editor (avoids caret reset)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };

  const addLink = () => {
    const url = window.prompt("URL do link", "https://");
    if (!url) return;
    exec("createLink", url);
  };

  const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-md border border-white/10 bg-white/5 text-slate-300 hover:text-amber-200 hover:border-amber-400/40 transition"
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 focus-within:border-amber-400/50 overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-white/10 bg-black/20">
        <Btn onClick={() => exec("bold")} title="Negrito"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("italic")} title="Itálico"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("strikeThrough")} title="Tachado"><Strikethrough className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Btn onClick={() => exec("formatBlock", "<h2>")} title="Título"><Heading2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("insertUnorderedList")} title="Lista"><List className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("insertOrderedList")} title="Lista numerada"><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={addLink} title="Link"><Link2 className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Btn onClick={() => exec("undo")} title="Desfazer"><Undo2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("redo")} title="Refazer"><Redo2 className="h-3.5 w-3.5" /></Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="rte-content px-3 py-2.5 text-sm text-white outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}
