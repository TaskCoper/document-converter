export type FileData = { content: string; sha: string; htmlUrl: string };

export type DirEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
};

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

export type Commit = {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  htmlUrl: string;
};
