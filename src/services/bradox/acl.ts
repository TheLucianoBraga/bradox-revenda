import type { AppRole } from "@/services/bradox/session";

const CLIENT_ALLOWED_PATHS = ["/dashboard", "/posts", "/planos", "/creditos", "/pagamentos", "/billing"];

export function canAccessPanel(role: AppRole | null | undefined) {
  return role === "admin" || role === "revenda" || role === "cliente";
}

export function canAccessPath(role: AppRole | null | undefined, path: string) {
  if (!role) return false;
  if (role === "admin" || role === "revenda") return true;

  const normalizedPath = normalizePath(path);
  return CLIENT_ALLOWED_PATHS.some((allowedPath) => normalizedPath === allowedPath || normalizedPath.startsWith(`${allowedPath}/`));
}

export function isClientRole(role: AppRole | null | undefined) {
  return role === "cliente";
}

function normalizePath(path: string) {
  if (!path) return "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}
