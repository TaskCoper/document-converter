import type { FileType } from "@/lib/file-type";

export type StorySitemapEntry = {
  type: "user-story";
  id: string;
  path: string;
  story: string;
  sprint: string;
  priority: string;
  status: string;
  assignee: string;
  creator: string;
};

export type TddSitemapEntry = {
  type: "tdd";
  id: string;
  path: string;
  feature: string;
  status: string;
  version: string;
  author: string;
  reviewer: string;
  updatedAt: string;
};

export type RuleSitemapEntry = {
  type: "business-rule";
  id: string;
  path: string;
  name: string;
  category: string;
  status: string;
  version: string;
  owner: string;
  effectiveDate: string;
};

export type SitemapEntry =
  | StorySitemapEntry
  | TddSitemapEntry
  | RuleSitemapEntry;

export type RootSitemapFolder = {
  name: string;
  types: FileType[];
  count: number;
};

export type RootSitemapOverrides = {
  upserts?: Map<string, SitemapEntry[]>;
  deletedFolders?: Set<string>;
};

export type RootSitemapComputeOpts = {
  // When true and a root sitemap already exists, trust its folder membership
  // and only recompute (types, count) for folders touched by `overrides`.
  // Avoids listDir("") and per-folder sitemap fetches — the common save/delete
  // path where the folder set doesn't change.
  trustExistingRoot?: boolean;
};
