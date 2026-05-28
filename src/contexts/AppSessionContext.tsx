import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchAppSessionData, type NetworkRow, type ProfileRow } from "@/services/bradox/session";

const ACTIVE_NETWORK_STORAGE_KEY = "bradox.activeNetworkId";

type AppSessionContextValue = {
  profile: ProfileRow | null;
  networks: NetworkRow[];
  activeNetwork: NetworkRow | null;
  activeNetworkId: string | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  canSwitchNetwork: boolean;
  setActiveNetworkId: (networkId: string) => void;
  refreshSession: () => Promise<void>;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [networks, setNetworks] = useState<NetworkRow[]>([]);
  const [activeNetworkId, setActiveNetworkIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionData = await fetchAppSessionData();
      const nextProfile = sessionData?.profile ?? null;
      const nextNetworks = sessionData?.networks ?? [];
      const nextActiveNetworkId = resolveActiveNetworkId(nextProfile, nextNetworks);

      setProfile(nextProfile);
      setNetworks(nextNetworks);
      setActiveNetworkIdState(nextActiveNetworkId);
      persistActiveNetworkId(nextActiveNetworkId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nao foi possivel carregar a sessao.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const activeNetwork = useMemo(
    () => networks.find((network) => network.id === activeNetworkId) ?? null,
    [activeNetworkId, networks],
  );

  const setActiveNetworkId = (networkId: string) => {
    const allowed = networks.some((network) => network.id === networkId);
    if (!allowed) return;
    setActiveNetworkIdState(networkId);
    persistActiveNetworkId(networkId);
  };

  const value = useMemo<AppSessionContextValue>(() => ({
    profile,
    networks,
    activeNetwork,
    activeNetworkId,
    loading,
    error,
    isAdmin: profile?.role === "admin",
    canSwitchNetwork: profile?.role === "admin" && networks.length > 1,
    setActiveNetworkId,
    refreshSession,
  }), [profile, networks, activeNetwork, activeNetworkId, loading, error]);

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);
  if (!context) throw new Error("useAppSession deve ser usado dentro de AppSessionProvider");
  return context;
}

function resolveActiveNetworkId(profile: ProfileRow | null, networks: NetworkRow[]) {
  if (!profile || networks.length === 0) return null;

  if (profile.role !== "admin") {
    return profile.network_id && networks.some((network) => network.id === profile.network_id)
      ? profile.network_id
      : networks[0]?.id ?? null;
  }

  const persistedNetworkId = getPersistedActiveNetworkId();
  if (persistedNetworkId && networks.some((network) => network.id === persistedNetworkId)) {
    return persistedNetworkId;
  }

  if (profile.network_id && networks.some((network) => network.id === profile.network_id)) {
    return profile.network_id;
  }

  return networks[0]?.id ?? null;
}

function getPersistedActiveNetworkId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_NETWORK_STORAGE_KEY);
}

function persistActiveNetworkId(networkId: string | null) {
  if (typeof window === "undefined") return;
  if (networkId) window.localStorage.setItem(ACTIVE_NETWORK_STORAGE_KEY, networkId);
  else window.localStorage.removeItem(ACTIVE_NETWORK_STORAGE_KEY);
}