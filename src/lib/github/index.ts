export {
  authorFor,
  commitFiles,
  deleteDoc,
  getFile,
  getHistory,
  listDir,
  moveDoc,
  saveDoc,
  slugifyAuthor,
} from "./api";
export {
  getBranch,
  getRepoLabel,
  getRootDir,
  requireActiveRepo,
} from "./config";
export { GhError, messageFor, type GhErrorKind } from "./errors";
export { parentOf, topLevelOf } from "./paths";
export type {
  Change,
  Commit,
  CommitInput,
  CommitResult,
  DirEntry,
  FileData,
} from "./types";
