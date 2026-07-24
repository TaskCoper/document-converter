// Loại/trạng thái tài liệu theo backend (document_first.Repo/Enums/DocumentEnums.cs).
// Enum serialize thành SỐ. Tài liệu thuộc về PROJECT (nguồn sự thật là DB, không phải GitHub).

export const DocumentType = {
  UserStory: 1,
  Tdd: 2,
  BusinessRule: 3,
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const DocumentTypeLabel: Record<DocumentType, string> = {
  [DocumentType.UserStory]: "User Story",
  [DocumentType.Tdd]: "TDD",
  [DocumentType.BusinessRule]: "Business Rule",
};

export const LifecycleState = {
  Draft: 1,
  InReview: 2,
  Released: 3,
  Archived: 4,
} as const;
export type LifecycleState = (typeof LifecycleState)[keyof typeof LifecycleState];

export const LifecycleStateLabel: Record<LifecycleState, string> = {
  [LifecycleState.Draft]: "Nháp",
  [LifecycleState.InReview]: "Đang duyệt",
  [LifecycleState.Released]: "Đã phát hành",
  [LifecycleState.Archived]: "Lưu trữ",
};

// Trạng thái nghiệp vụ theo từng loại (dải 10 giá trị mỗi loại).
export const DocumentStatusLabel: Record<number, string> = {
  10: "Cần làm",
  11: "Đang làm",
  12: "Bị chặn",
  13: "Xong",
  20: "Nháp",
  21: "Đang duyệt",
  22: "Đã duyệt",
  23: "Ngừng dùng",
  30: "Nháp",
  31: "Hiệu lực",
  32: "Ngừng dùng",
};

export const StoryPriority = {
  Must: 1,
  Should: 2,
  Could: 3,
  Wont: 4,
} as const;
export type StoryPriority = (typeof StoryPriority)[keyof typeof StoryPriority];

export const StoryPriorityLabel: Record<StoryPriority, string> = {
  [StoryPriority.Must]: "Must",
  [StoryPriority.Should]: "Should",
  [StoryPriority.Could]: "Could",
  [StoryPriority.Wont]: "Won't",
};

// Các trạng thái nghiệp vụ hợp lệ theo từng loại (DB có CHECK ràng buộc dải).
export const STATUS_OPTIONS_BY_TYPE: Record<DocumentType, number[]> = {
  [DocumentType.UserStory]: [10, 11, 12, 13],
  [DocumentType.Tdd]: [20, 21, 22, 23],
  [DocumentType.BusinessRule]: [30, 31, 32],
};

export const LIFECYCLE_OPTIONS: LifecycleState[] = [
  LifecycleState.Draft,
  LifecycleState.InReview,
  LifecycleState.Released,
  LifecycleState.Archived,
];

export const PRIORITY_OPTIONS: StoryPriority[] = [
  StoryPriority.Must,
  StoryPriority.Should,
  StoryPriority.Could,
  StoryPriority.Wont,
];

// Bảng con trong DocumentSnapshot (dùng để map sang Schema của các exporter cũ khi render).
export interface AssigneeSnapshot {
  role: number; // AssigneeRole: Frontend=1, Backend=2...
  displayName: string;
  userId: string | null;
}
export interface ListItemSnapshot {
  itemType: number; // ListItemType: Precondition=1, NonFunctional=2, OutOfScope=3...
  label: string | null;
  content: string;
}
export interface FlowSnapshot {
  flowType: number; // FlowType: Main=1, Alternative=2, Exception=3
  code: string | null;
  title: string | null;
  steps: string[];
}
export interface CriterionSnapshot {
  code: string;
  givenText: string;
  whenText: string;
  thenText: string;
  andConditions: string[];
}
export interface LinkSnapshot {
  targetKind: number; // ReferenceKind: UserStory=1, Tdd=2, BusinessRule=3...
  targetDocKey: string;
  linkType: number;
  note: string | null;
}
export interface DiagramSnapshot {
  diagramType: number; // DiagramType: Activity=1, Sequence=2, State=3, Architecture=4, DataModel=5...
  format: number; // DiagramFormat: Mermaid=1, ExternalUrl=2, ImageUrl=3, PlantUml=4
  title: string | null;
  description: string | null;
  sourceCode: string | null;
  externalUrl: string | null;
}
export interface ExampleSnapshot {
  title: string | null;
  requestSample: string | null;
  responseSample: string | null;
  responseStatus: number | null;
  errorSample: string | null;
}
export interface EndpointSnapshot {
  scope: number; // ApiScope: Internal=1, External=2
  method: number | null; // ApiHttpMethod: Get=1..Options=7
  path: string | null;
  name: string | null;
  description: string | null;
  examples: ExampleSnapshot[];
}
export interface ErrorCodeSnapshot {
  code: string;
  httpStatus: number | null;
  description: string | null;
}
export interface ChangeLogSnapshot {
  versionLabel: string;
  createdAt: string;
  change: string | null;
  author: string | null;
}

// Nội dung tài liệu (DocumentSnapshot). Field đơn trị dùng để sửa; bảng con dùng để render
// lại qua exporter cũ (toHtml/toTddHtml/toRuleHtml).
export interface DocumentContent {
  title: string;
  status: number;
  sprint: number | null;
  priority: StoryPriority | null;
  ownerName: string | null;
  notesMd: string | null;
  // UserStory
  storyStatement: string | null;
  context: string | null;
  trigger: string | null;
  // Tdd
  featureName: string | null;
  problem: string | null;
  reviewerName: string | null;
  externalErrorHandling: string | null;
  // BusinessRule
  ruleName: string | null;
  category: string | null;
  effectiveDate: string | null;
  statement: string | null;
  whenCondition: string | null;
  thenAction: string | null;
  exceptCondition: string | null;
  ruleNotes: string | null;
  ruleOwnerName: string | null;
  source: string | null;
  // Bảng con
  assignees: AssigneeSnapshot[];
  listItems: ListItemSnapshot[];
  flows: FlowSnapshot[];
  acceptanceCriteria: CriterionSnapshot[];
  links: LinkSnapshot[];
  diagrams: DiagramSnapshot[];
  endpoints: EndpointSnapshot[];
  errorCodes: ErrorCodeSnapshot[];
  changeLog: ChangeLogSnapshot[];
  versionLabel: string | null;
  updatedAt: string | null;
}

export interface DocumentDetail {
  id: string;
  projectId: string;
  docKey: string;
  docType: DocumentType;
  lifecycleState: LifecycleState;
  status: number;
  ownerId: string | null;
  currentVersionNumber: number;
  hasUnpublishedChanges: boolean;
  tagIds: string[];
  createdAt: string;
  updatedAt: string | null;
  content: DocumentContent;
}

// Đồ thị liên kết tài liệu — xem GraphController/GraphService.IService ở backend.
export const DocumentLinkType = {
  References: 1,
  DependsOn: 2,
  Implements: 3,
  GovernedBy: 4,
  Blocks: 5,
  RelatedTo: 6,
  Supersedes: 7,
} as const;
export type DocumentLinkType =
  (typeof DocumentLinkType)[keyof typeof DocumentLinkType];

export const DocumentLinkTypeLabel: Record<DocumentLinkType, string> = {
  [DocumentLinkType.References]: "Tham chiếu",
  [DocumentLinkType.DependsOn]: "Phụ thuộc",
  [DocumentLinkType.Implements]: "Hiện thực hoá",
  [DocumentLinkType.GovernedBy]: "Chịu ràng buộc bởi",
  [DocumentLinkType.Blocks]: "Chặn",
  [DocumentLinkType.RelatedTo]: "Liên quan",
  [DocumentLinkType.Supersedes]: "Thay thế",
};

export interface IncomingLink {
  sourceDocumentId: string;
  sourceDocKey: string;
  sourceDocType: DocumentType;
  sourceTitle: string;
  sourceLifecycleState: LifecycleState;
  linkType: DocumentLinkType;
  note: string | null;
}

export interface ImpactedDocument {
  documentId: string;
  docKey: string;
  docType: DocumentType;
  title: string;
  lifecycleState: LifecycleState;
  // 1 = trỏ thẳng tới tài liệu gốc, càng lớn càng gián tiếp.
  depth: number;
  viaLinkType: DocumentLinkType;
  // Đã publish thì sửa tài liệu gốc đồng nghĩa file trên GitHub cũng lệch theo.
  isReleased: boolean;
}

export interface ImpactReport {
  documentId: string;
  docKey: string;
  title: string;
  maxDepth: number;
  propagatingLinkTypes: DocumentLinkType[];
  impacted: ImpactedDocument[];
}

// Đồ thị liên kết CẢ PROJECT (khác incoming-links/impact ở trên vốn theo từng tài liệu) — xem
// GraphController/GraphService.IService ở backend.
export interface GraphNode {
  id: string;
  docKey: string;
  docType: DocumentType;
  title: string;
  lifecycleState: LifecycleState;
  incomingCount: number;
  outgoingCount: number;
}

export interface GraphEdge {
  sourceId: string;
  // null = cạnh trỏ tới doc_key chưa resolve được — vẫn trả về để không giấu mất chỗ thiếu.
  targetId: string | null;
  targetDocKey: string;
  linkType: DocumentLinkType;
  targetKind: number; // ReferenceKind: UserStory=1, Tdd=2, BusinessRule=3, UseCase=4
  isResolved: boolean;
}

export interface GraphView {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const LinkIssueKind = {
  Dangling: 1,
  TargetArchived: 2,
  TargetDeprecated: 3,
  ResolvableButUnresolved: 4,
} as const;
export type LinkIssueKind = (typeof LinkIssueKind)[keyof typeof LinkIssueKind];

export const LinkIssueKindLabel: Record<LinkIssueKind, string> = {
  [LinkIssueKind.Dangling]: "Link hỏng (đích không tồn tại)",
  [LinkIssueKind.TargetArchived]: "Đích đã lưu trữ",
  [LinkIssueKind.TargetDeprecated]: "Đích ngừng dùng",
  [LinkIssueKind.ResolvableButUnresolved]: "Có thể nối nhưng chưa nối",
};

export interface LinkIssue {
  sourceDocumentId: string;
  sourceDocKey: string;
  targetDocKey: string;
  linkType: DocumentLinkType;
  kind: LinkIssueKind;
  detail: string;
  sinceAt: string;
}

export const ErrorCodeConflictKind = {
  StatusMismatch: 1,
  DuplicateDefinition: 2,
} as const;
export type ErrorCodeConflictKind =
  (typeof ErrorCodeConflictKind)[keyof typeof ErrorCodeConflictKind];

export const ErrorCodeConflictKindLabel: Record<ErrorCodeConflictKind, string> = {
  [ErrorCodeConflictKind.StatusMismatch]: "Lệch HTTP status",
  [ErrorCodeConflictKind.DuplicateDefinition]: "Định nghĩa trùng",
};

export interface ErrorCodeEntry {
  code: string;
  httpStatus: number | null;
  description: string | null;
  documentId: string;
  docKey: string;
  documentTitle: string;
}

export interface ErrorCodeConflict {
  code: string;
  kind: ErrorCodeConflictKind;
  entries: ErrorCodeEntry[];
}

export interface ErrorCodeRegistry {
  codes: ErrorCodeEntry[];
  conflicts: ErrorCodeConflict[];
}

// Tìm kiếm trong project — xem SearchController/SearchService.IService ở backend.
export const SearchMode = {
  Hybrid: 0, // Trộn full-text và ngữ nghĩa (mặc định).
  Lexical: 1, // Chỉ full-text — khớp chính xác từ khoá.
  Semantic: 2, // Chỉ vector — tìm theo ý nghĩa.
} as const;
export type SearchMode = (typeof SearchMode)[keyof typeof SearchMode];

export interface SearchHit {
  documentId: string;
  docKey: string;
  docType: DocumentType;
  title: string;
  summary: string | null;
  lifecycleState: LifecycleState;
  score: number;
  matchedSection: string | null;
  // Đoạn trích quanh từ khoá, từ khớp được bọc trong **...**.
  highlight: string | null;
}

export interface SearchResponse {
  query: string;
  mode: SearchMode;
  usedLexical: boolean;
  usedSemantic: boolean;
  usedTrigramFallback: boolean;
  semanticSkippedReason: string | null;
  hits: SearchHit[];
}

// Một dòng trong danh sách tài liệu — xem DocumentListRow ở backend.
export interface DocumentListRow {
  id: string;
  docKey: string;
  docType: DocumentType;
  title: string;
  summary: string | null;
  lifecycleState: LifecycleState;
  status: number;
  sprint: number | null;
  priority: StoryPriority | null;
  category: string | null;
  effectiveDate: string | null;
  currentVersionNumber: number;
  hasUnpublishedChanges: boolean;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// Lịch sử version & Release — xem ReleaseController/ReleaseService ở backend. "status" giữ
// dạng số thô (chưa xác nhận đủ giá trị enum từ backend) — hiển thị fallback về số nếu không
// khớp nhãn nào, giống DocumentStatusLabel[x] ?? x.
export interface VersionListRow {
  versionNumber: number;
  versionLabel: string | null;
  title: string;
  status: number;
  contentHash: string;
  generatorVersion: string;
  changeSummary: string | null;
  createdByName: string | null;
  createdAt: string;
  publishJobCount: number;
  publishedCount: number;
}

export interface VersionDetail {
  id: string;
  documentId: string;
  versionNumber: number;
  versionLabel: string | null;
  docKey: string;
  docType: DocumentType;
  title: string;
  status: number;
  contentHash: string;
  generatorVersion: string;
  baseVersionNumber: number | null;
  changeSummary: string | null;
  createdByName: string | null;
  createdAt: string;
  content: DocumentContent;
}

export const DiffChangeKind = {
  Added: 1,
  Removed: 2,
  Modified: 3,
} as const;
export type DiffChangeKind = (typeof DiffChangeKind)[keyof typeof DiffChangeKind];

export const DiffChangeKindLabel: Record<DiffChangeKind, string> = {
  [DiffChangeKind.Added]: "Thêm mới",
  [DiffChangeKind.Removed]: "Đã xoá",
  [DiffChangeKind.Modified]: "Đã sửa",
};

export interface FieldChange {
  path: string;
  kind: DiffChangeKind;
  oldValue: string | null;
  newValue: string | null;
}

export interface VersionDiff {
  fromVersion: number;
  toVersion: number;
  contentIdentical: boolean;
  changes: FieldChange[];
}
