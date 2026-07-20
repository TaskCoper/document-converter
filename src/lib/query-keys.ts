export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const ghKeys = {
  dir: (path: string) => ["gh", "dir", path] as const,
  file: (path: string) => ["gh", "file", path] as const,
  historyAll: () => ["gh", "history", ""] as const,
  historyPath: (path: string) => ["gh", "history", path] as const,
  storiesAll: () => ["gh", "stories", "all"] as const,
  tddsAll: () => ["gh", "tdds", "all"] as const,
  rulesAll: () => ["gh", "rules", "all"] as const,
};

export const GH_STALE = 30_000;
