import { create } from "zustand";
import { persist } from "zustand/middleware";

const trim = (s: string) => s.replace(/^\/+|\/+$/g, "");

export type RepoConfig = {
  id: string;
  label?: string;
  token: string;
  owner: string;
  repo: string;
  branch: string;
  rootDir: string;
};

export type RepoInput = Omit<RepoConfig, "id">;

type ReposStore = {
  repos: RepoConfig[];
  activeRepoId: string | null;
  add: (input: RepoInput) => string;
  update: (id: string, patch: Partial<RepoInput>) => void;
  remove: (id: string) => void;
  setActive: (id: string | null) => void;
};

function normalize(input: RepoInput): RepoInput {
  return {
    ...input,
    token: input.token.trim(),
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    branch: input.branch.trim() || "main",
    rootDir: trim(input.rootDir ?? ""),
    label: input.label?.trim() || undefined,
  };
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `repo_${Math.random().toString(36).slice(2)}_${String(performance.now()).replace(".", "")}`;
}

function seedFromEnv(): RepoConfig | null {
  const token = (import.meta.env.VITE_GH_TOKEN as string | undefined)?.trim();
  const owner = (import.meta.env.VITE_GH_OWNER as string | undefined)?.trim();
  const repo = (import.meta.env.VITE_GH_REPO as string | undefined)?.trim();
  if (!token || !owner || !repo) return null;
  const branch =
    (import.meta.env.VITE_GH_BRANCH as string | undefined)?.trim() || "main";
  const rootDir = trim(
    (import.meta.env.VITE_GH_ROOT_DIR as string | undefined) ?? "",
  );
  return { id: newId(), token, owner, repo, branch, rootDir };
}

export const useReposStore = create<ReposStore>()(
  persist(
    (set) => ({
      repos: [],
      activeRepoId: null,
      add: (input) => {
        const id = newId();
        set((s) => ({ repos: [...s.repos, { id, ...normalize(input) }] }));
        return id;
      },
      update: (id, patch) =>
        set((s) => ({
          repos: s.repos.map((r) =>
            r.id === id ? { ...r, ...normalize({ ...r, ...patch }) } : r,
          ),
        })),
      remove: (id) =>
        set((s) => ({
          repos: s.repos.filter((r) => r.id !== id),
          activeRepoId: s.activeRepoId === id ? null : s.activeRepoId,
        })),
      setActive: (id) => set({ activeRepoId: id }),
    }),
    {
      name: "vnz-converter-repos",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.repos.length === 0) {
          const seed = seedFromEnv();
          if (seed) {
            state.repos = [seed];
            state.activeRepoId = seed.id;
          }
        }
      },
    },
  ),
);

export function useActiveRepo(): RepoConfig | null {
  return useReposStore((s) => {
    if (!s.activeRepoId) return null;
    return s.repos.find((r) => r.id === s.activeRepoId) ?? null;
  });
}

export function getActiveRepo(): RepoConfig | null {
  const { repos, activeRepoId } = useReposStore.getState();
  if (!activeRepoId) return null;
  return repos.find((r) => r.id === activeRepoId) ?? null;
}
