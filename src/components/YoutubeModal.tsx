import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function extractId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m?.[1] ?? null;
}

export function YoutubeModal({ url, open, onOpenChange, title }: { url: string; open: boolean; onOpenChange: (o: boolean) => void; title?: string }) {
  const id = extractId(url);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-black/95 border-cyan-400/30 overflow-hidden">
        <DialogTitle className="sr-only">{title ?? "Vídeo"}</DialogTitle>
        <div className="relative aspect-video w-full">
          {id ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
              title={title ?? "YouTube"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="grid place-items-center h-full text-slate-400 text-sm">Link inválido do YouTube</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
