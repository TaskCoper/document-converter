const trim = (s: string) => s.replace(/^\/+|\/+$/g, "");

export const CFG = {
  token: import.meta.env.VITE_GH_TOKEN as string,
  owner: import.meta.env.VITE_GH_OWNER as string,
  repo: import.meta.env.VITE_GH_REPO as string,
  branch: (import.meta.env.VITE_GH_BRANCH as string) || "main",
  rootDir: trim((import.meta.env.VITE_GH_ROOT_DIR as string) || ""),
};

export const REPO_LABEL = `${CFG.owner}/${CFG.repo}@${CFG.branch}${
  CFG.rootDir ? `:${CFG.rootDir}/` : ""
}`;
export const BRANCH = CFG.branch;
export const ROOT_DIR = CFG.rootDir;

export function scoped(path: string): string {
  const clean = trim(path);
  if (!CFG.rootDir) return clean;
  return clean ? `${CFG.rootDir}/${clean}` : CFG.rootDir;
}

export function stripRoot(p: string): string {
  if (!CFG.rootDir) return p;
  const prefix = `${CFG.rootDir}/`;
  return p.startsWith(prefix) ? p.slice(prefix.length) : p;
}

export const encPath = (p: string) =>
  p.split("/").filter(Boolean).map(encodeURIComponent).join("/");
