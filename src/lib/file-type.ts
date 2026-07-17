export type FileType = "user-story" | "tdd" | "business-rule";

const TDD_MARKER = /^##\s+Document Info\s*$/m;
const USER_STORY_MARKER = /^##\s+Metadata\s*$/m;
const BUSINESS_RULE_MARKER = /^##\s+Rule Info\s*$/m;

export function detectType(md: string): FileType | null {
  if (TDD_MARKER.test(md)) return "tdd";
  if (USER_STORY_MARKER.test(md)) return "user-story";
  if (BUSINESS_RULE_MARKER.test(md)) return "business-rule";
  return null;
}
