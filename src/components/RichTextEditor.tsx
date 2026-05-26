import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Bold, Italic, List, ListOrdered, Link2, Strikethrough, Heading2, Undo2, Redo2, Image as ImageIcon } from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export function RichTextEditor({ value, onChange, placeholder, minHeight = 160 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const emit = () => onChange(ref.current?.innerHTML ?? "");

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt("URL do link", "https://");
    if (!url) return;
    exec("createLink", url);
  };

  const insertImage = (dataUrl: string) => {
    ref.current?.focus();
    const ok = document.execCommand(
      "insertHTML",
      false,
      `<p><img src="${dataUrl}" alt="" style="max-width:100%;height:auto;border-radius:10px;" /></p><p><br/></p>`,
    );
    if (!ok && ref.current) {
      ref.current.innerHTML += `<p><img src="${dataUrl}" alt="" style="max-width:100%;height:auto;border-radius:10px;" /></p>`;
    }
    emit();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || !files.length) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: apenas imagens`);
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: ultrapassa 20 MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => insertImage(reader.result as string);
      reader.onerror = () => toast.error(`Falha ao ler ${file.name}`);
      reader.readAsDataURL(file);
    });
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleFiles([file] as unknown as FileList);
          return;
        }
      }
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer?.files?.length) {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    }
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
        <Btn onClick={() => fileRef.current?.click()} title="Inserir imagem (até 20 MB)"><ImageIcon className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Btn onClick={() => exec("undo")} title="Desfazer"><Undo2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("redo")} title="Refazer"><Redo2 className="h-3.5 w-3.5" /></Btn>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onPaste={onPaste}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rte-content px-3 py-2.5 text-sm text-white outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}
