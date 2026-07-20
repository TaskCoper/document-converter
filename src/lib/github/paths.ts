export function parentOf(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  const idx = trimmed.lastIndexOf("/");
  return idx === -1 ? "" : trimmed.slice(0, idx);
}

export function topLevelOf(folder: string): string {
  return folder.split("/")[0];
}
