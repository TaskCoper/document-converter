import { getActiveRepo, type RepoConfig } from "@/features/repos/store";
import { GhError } from "./errors";

const trim = (s: string) => s.replace(/^\/+|\/+$/g, "");

export function requireActiveRepo(): RepoConfig {
  const repo = getActiveRepo();
  if (!repo) {
    throw new GhError(
      "VALIDATION",
      undefined,
      "Chưa chọn kho. Hãy chọn một kho trước khi thao tác.",
    );
  }
  return repo;
}

export function getRepoLabel(): string {
  const r = getActiveRepo();
  if (!r) return "";
  const suffix = r.rootDir ? `:${r.rootDir}/` : "";
  return `${r.owner}/${r.repo}@${r.branch}${suffix}`;
}

export function getBranch(): string {
  return getActiveRepo()?.branch ?? "main";
}

export function getRootDir(): string {
  return getActiveRepo()?.rootDir ?? "";
}

export function scoped(path: string): string {
  const clean = trim(path);
  const root = getRootDir();
  if (!root) return clean;
  return clean ? `${root}/${clean}` : root;
}

export function stripRoot(p: string): string {
  const root = getRootDir();
  if (!root) return p;
  const prefix = `${root}/`;
  return p.startsWith(prefix) ? p.slice(prefix.length) : p;
}

export const encPath = (p: string) =>
  p.split("/").filter(Boolean).map(encodeURIComponent).join("/");
