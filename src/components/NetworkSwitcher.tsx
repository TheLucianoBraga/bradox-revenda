import { Network } from "lucide-react";
import { useAppSession } from "@/contexts/AppSessionContext";

export function NetworkSwitcher() {
  const { activeNetwork, activeNetworkId, canSwitchNetwork, loading, networks, setActiveNetworkId } = useAppSession();

  if (loading) {
    return <div className="hidden lg:block h-9 w-40 rounded-[10px] bg-white/5 border border-white/10 animate-pulse" />;
  }

  if (!activeNetwork) {
    return null;
  }

  if (!canSwitchNetwork) {
    return (
      <div className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-[10px] border border-white/10 bg-white/5 text-[11px] text-slate-300">
        <Network className="h-3.5 w-3.5 text-amber-300" />
        <span className="max-w-36 truncate">{activeNetwork.name}</span>
      </div>
    );
  }

  return (
    <label className="hidden lg:flex items-center gap-2 h-9 px-2.5 rounded-[10px] border border-white/10 bg-white/5 text-[11px] text-slate-300">
      <Network className="h-3.5 w-3.5 text-amber-300" />
      <select
        value={activeNetworkId ?? ""}
        onChange={(event) => setActiveNetworkId(event.target.value)}
        className="max-w-44 bg-transparent text-[11px] text-slate-200 outline-none"
      >
        {networks.map((network) => (
          <option key={network.id} value={network.id} className="bg-zinc-950 text-slate-100">
            {network.name}
          </option>
        ))}
      </select>
    </label>
  );
}