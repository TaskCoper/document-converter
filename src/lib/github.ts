import axios, { AxiosError, type AxiosInstance } from "axios";

const trim = (s: string) => s.replace(/^\/+|\/+$/g, "");

const CFG = {
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

function scoped(path: string): string {
  const clean = trim(path);
  if (!CFG.rootDir) return clean;
  return clean ? `${CFG.rootDir}/${clean}` : CFG.rootDir;
}

export type GhErrorKind =
  | "CONFLICT"
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "UNAUTHORIZED"
  | "VALIDATION"
  | "NETWORK"
  | "OTHER";

export class GhError extends Error {
  kind: GhErrorKind;
  status?: number;
  detail?: string;
  constructor(kind: GhErrorKind, status?: number, detail?: string) {
    super(
      `${kind}${status ? ` (${status})` : ""}${detail ? `: ${detail}` : ""}`,
    );
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

const api: AxiosInstance = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `Bearer ${CFG.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
  },
});

api.interceptors.request.use((config) => {
  if ((config.method ?? "get").toLowerCase() === "get") {
    config.params = { ...(config.params ?? {}), _ts: Date.now() };
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ message?: string }>) => {
    if (!err.response) throw new GhError("NETWORK", undefined, err.message);
    const { status, data } = err.response;
    const detail = data?.message;
    if (status === 401) throw new GhError("UNAUTHORIZED", status, detail);
    if (status === 403 || status === 429)
      throw new GhError("RATE_LIMIT", status, detail);
    if (status === 404) throw new GhError("NOT_FOUND", status, detail);
    if (status === 409) throw new GhError("CONFLICT", status, detail);
    if (status === 422) throw new GhError("VALIDATION", status, detail);
    throw new GhError("OTHER", status, detail);
  },
);

// UTF-8-safe base64 for reads — plain atob corrupts Vietnamese characters.
// Writes use the Git Data tree endpoint which takes raw UTF-8 in `content`,
// so no encode counterpart is needed.
function decodeB64(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const encPath = (p: string) =>
  p.split("/").filter(Boolean).map(encodeURIComponent).join("/");

export function slugifyAuthor(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9.-]/g, "") || "web-guest";
}

export function authorFor(name: string) {
  const clean = name.trim() || "web-guest";
  return { name: clean, email: `${slugifyAuthor(clean)}@hoatheomua.web` };
}

export type FileData = { content: string; sha: string; htmlUrl: string };
export type DirEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
};

function contentsUrl(path: string) {
  return `/repos/${CFG.owner}/${CFG.repo}/contents/${encPath(scoped(path))}`;
}

function stripRoot(p: string): string {
  if (!CFG.rootDir) return p;
  const prefix = `${CFG.rootDir}/`;
  return p.startsWith(prefix) ? p.slice(prefix.length) : p;
}

export async function getFile(path: string): Promise<FileData | null> {
  try {
    const { data } = await api.get(contentsUrl(path), {
      params: { ref: CFG.branch },
    });
    if (Array.isArray(data))
      throw new GhError("VALIDATION", 200, "path is a directory, not a file");
    return {
      content: decodeB64(data.content),
      sha: data.sha,
      htmlUrl: data.html_url,
    };
  } catch (e) {
    if (e instanceof GhError && e.kind === "NOT_FOUND") return null;
    throw e;
  }
}

export async function listDir(path: string): Promise<DirEntry[]> {
  try {
    const { data } = await api.get(contentsUrl(path), {
      params: { ref: CFG.branch },
    });
    if (!Array.isArray(data))
      throw new GhError("VALIDATION", 200, "path is a file, not a directory");
    const entries: DirEntry[] = (
      data as Array<{ name: string; path: string; type: string; sha: string }>
    ).map((e) => ({
      name: e.name,
      path: stripRoot(e.path),
      type: e.type === "dir" ? "dir" : "file",
      sha: e.sha,
    }));
    return entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch (e) {
    // Empty scoped root (docs/ not yet created) → treat as empty listing.
    if (e instanceof GhError && e.kind === "NOT_FOUND" && !trim(path)) {
      return [];
    }
    throw e;
  }
}

export type Change =
  | { action: "upsert"; path: string; content: string }
  | { action: "delete"; path: string };

export type CommitInput = {
  changes: Change[];
  message: string;
  websiteUser: string;
};

export type CommitResult = {
  commitSha: string;
  treeSha: string;
  htmlUrl: string;
};

type TreeEntry =
  | { path: string; mode: "100644"; type: "blob"; content: string }
  | { path: string; mode: "100644"; type: "blob"; sha: null };

const isFastForwardError = (e: GhError) =>
  e.kind === "CONFLICT" ||
  (e.kind === "VALIDATION" && /not (a )?fast[- ]forward/i.test(e.detail ?? ""));

function buildTreeEntries(changes: Change[]): TreeEntry[] {
  return changes.map((c) =>
    c.action === "upsert"
      ? { path: scoped(c.path), mode: "100644", type: "blob", content: c.content }
      : { path: scoped(c.path), mode: "100644", type: "blob", sha: null },
  );
}

async function attemptCommit(input: CommitInput): Promise<CommitResult> {
  const author = authorFor(input.websiteUser);
  const refUrl = `/repos/${CFG.owner}/${CFG.repo}/git/refs/heads/${CFG.branch}`;

  let baseCommitSha: string | null = null;
  let baseTreeSha: string | null = null;
  let emptyBranch = false;

  try {
    const { data: refData } = await api.get(refUrl);
    baseCommitSha = refData.object.sha as string;
  } catch (e) {
    if (e instanceof GhError && e.kind === "NOT_FOUND") emptyBranch = true;
    else throw e;
  }

  if (!emptyBranch && baseCommitSha) {
    const { data: commitData } = await api.get(
      `/repos/${CFG.owner}/${CFG.repo}/git/commits/${baseCommitSha}`,
    );
    baseTreeSha = commitData.tree.sha as string;
  }

  const treeBody: Record<string, unknown> = {
    tree: buildTreeEntries(input.changes),
  };
  if (baseTreeSha) treeBody.base_tree = baseTreeSha;
  const { data: treeData } = await api.post(
    `/repos/${CFG.owner}/${CFG.repo}/git/trees`,
    treeBody,
  );
  const newTreeSha = treeData.sha as string;

  const { data: commitData } = await api.post(
    `/repos/${CFG.owner}/${CFG.repo}/git/commits`,
    {
      message: input.message,
      tree: newTreeSha,
      parents: emptyBranch || !baseCommitSha ? [] : [baseCommitSha],
      author,
      committer: author,
    },
  );
  const newCommitSha = commitData.sha as string;
  const htmlUrl = commitData.html_url as string;

  if (emptyBranch) {
    await api.post(`/repos/${CFG.owner}/${CFG.repo}/git/refs`, {
      ref: `refs/heads/${CFG.branch}`,
      sha: newCommitSha,
    });
  } else {
    await api.patch(refUrl, { sha: newCommitSha, force: false });
  }

  return { commitSha: newCommitSha, treeSha: newTreeSha, htmlUrl };
}

export async function commitFiles(
  input: CommitInput,
): Promise<CommitResult | null> {
  const dedup = new Map<string, Change>();
  for (const c of input.changes) dedup.set(scoped(c.path), c);
  const changes = Array.from(dedup.values());
  if (!changes.length) return null;

  const normalized: CommitInput = { ...input, changes };
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptCommit(normalized);
    } catch (e) {
      if (e instanceof GhError && isFastForwardError(e)) {
        lastErr = e;
        continue;
      }
      throw e;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new GhError("CONFLICT", undefined, "exhausted retries");
}

export async function saveDoc(
  path: string,
  content: string,
  message: string,
  websiteUser: string,
): Promise<CommitResult | null> {
  return commitFiles({
    changes: [{ action: "upsert", path, content }],
    message,
    websiteUser,
  });
}

export async function deleteDoc(
  path: string,
  message: string,
  websiteUser: string,
): Promise<CommitResult | null> {
  return commitFiles({
    changes: [{ action: "delete", path }],
    message,
    websiteUser,
  });
}

export async function moveDoc(
  fromPath: string,
  toPath: string,
  message: string,
  websiteUser: string,
  content?: string,
): Promise<CommitResult | null> {
  let body = content;
  if (body === undefined) {
    const file = await getFile(fromPath);
    if (!file) throw new GhError("NOT_FOUND", undefined, fromPath);
    body = file.content;
  }
  return commitFiles({
    changes: [
      { action: "upsert", path: toPath, content: body },
      { action: "delete", path: fromPath },
    ],
    message,
    websiteUser,
  });
}


export type Commit = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  htmlUrl: string;
};

export async function getHistory(
  path?: string,
  perPage = 20,
): Promise<Commit[]> {
  const filter = path ? scoped(path) : CFG.rootDir || undefined;
  const { data } = await api.get(`/repos/${CFG.owner}/${CFG.repo}/commits`, {
    params: {
      sha: CFG.branch,
      per_page: perPage,
      ...(filter ? { path: filter } : {}),
    },
  });
  return (
    data as Array<{
      sha: string;
      commit: { message: string; author: { name: string; date: string } };
      html_url: string;
    }>
  ).map((c) => ({
    sha: c.sha,
    shortSha: c.sha.slice(0, 7),
    message: c.commit.message,
    author: c.commit.author.name,
    date: c.commit.author.date,
    htmlUrl: c.html_url,
  }));
}
