import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { CreateDocumentDialog } from "@/features/projects/components/create-document-dialog";
import {
  DocumentStatusLabel,
  DocumentType,
  DocumentTypeLabel,
  LifecycleStateLabel,
  StoryPriorityLabel,
  type DocumentListRow,
} from "@/features/projects/document-types";
import { useDocuments } from "@/features/projects/hooks/use-documents";
import { useMyProjectRole } from "@/features/projects/hooks/use-my-role";
import { canEditDocuments } from "@/features/projects/permissions";
import {
  ArrowLeftIcon,
  FileTextIcon,
  NetworkIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const TYPE_TABS: { label: string; value: DocumentType | undefined }[] = [
  { label: "Tất cả", value: undefined },
  { label: "User Story", value: DocumentType.UserStory },
  { label: "TDD", value: DocumentType.Tdd },
  { label: "Business Rule", value: DocumentType.BusinessRule },
];

const TYPE_BADGE: Record<DocumentType, "default" | "secondary" | "outline"> = {
  [DocumentType.UserStory]: "default",
  [DocumentType.Tdd]: "secondary",
  [DocumentType.BusinessRule]: "outline",
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
};

export default function ProjectDocumentsPage() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const myRole = useMyProjectRole(projectId);
  const canCreate = !!myRole && canEditDocuments(myRole);

  const [docType, setDocType] = useState<DocumentType | undefined>(undefined);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { documents, totalCount, isLoading, isFetching, isError } =
    useDocuments(projectId, { docType, keyword });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link
        to={`/projects`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeftIcon className="size-3.5" />
        Về dự án
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-primary">Tài liệu</h1>
          <p className="text-xs text-muted-foreground">
            User Story, TDD và Business Rule của dự án — lấy từ backend.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <Spinner className="size-4" />}
          {myRole && (
            <Button
              variant="outline"
              size="sm"
              render={<Link to={`/projects/${projectId}/graph`} />}
            >
              <NetworkIcon className="size-3.5" />
              Đồ thị
            </Button>
          )}
          {myRole && (
            <Button
              variant="outline"
              size="sm"
              render={<Link to={`/projects/${projectId}`} />}
            >
              <SettingsIcon className="size-3.5" />
              Cấu hình
            </Button>
          )}
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-3.5" />
              Tạo tài liệu
            </Button>
          )}
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {TYPE_TABS.map((tab) => (
            <Button
              key={tab.label}
              type="button"
              size="sm"
              variant={docType === tab.value ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setDocType(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setKeyword(keywordInput.trim());
            }}
            placeholder="Tìm tiêu đề / mã, Enter để tìm"
            spellCheck={false}
            autoComplete="off"
            className="h-8 w-64 pl-7 text-xs"
          />
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="py-12 text-center text-xs text-destructive">
            Không tải được danh sách tài liệu.
          </p>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-border py-12 text-center">
            <FileTextIcon className="size-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {keyword || docType
                ? "Không có tài liệu khớp bộ lọc."
                : "Dự án chưa có tài liệu nào."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-border/40">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="w-32 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Mã
                    </th>
                    <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Loại
                    </th>
                    <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                      Tiêu đề
                    </th>
                    <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Trạng thái
                    </th>
                    <th className="w-24 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Vòng đời
                    </th>
                    <th className="w-16 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Bản
                    </th>
                    <th className="w-32 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Chủ sở hữu
                    </th>
                    <th className="w-24 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Cập nhật
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      onOpen={() =>
                        navigate(`/projects/${projectId}/documents/${doc.id}`)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {totalCount} tài liệu
            </p>
          </>
        )}
      </div>

      <CreateDocumentDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(doc) => {
          setCreateOpen(false);
          // TDD/Business Rule: đi thẳng vào wizard soạn nội dung (vừa tạo chỉ có tiêu đề).
          // User Story: giữ hành vi cũ, vào trang chi tiết trước.
          const suffix = doc.docType === DocumentType.UserStory ? "" : "/edit";
          navigate(`/projects/${projectId}/documents/${doc.id}${suffix}`);
        }}
      />
    </div>
  );
}

function DocumentRow({
  doc,
  onOpen,
}: {
  doc: DocumentListRow;
  onOpen: () => void;
}) {
  return (
    <tr className="cursor-pointer hover:bg-primary/5" onClick={onOpen}>
      <td className="border border-border/40 px-2 py-1.5 align-top font-mono text-muted-foreground">
        {doc.docKey}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top">
        <Badge variant={TYPE_BADGE[doc.docType]} className="text-[10px]">
          {DocumentTypeLabel[doc.docType]}
        </Badge>
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top">
        <div className="font-medium">{doc.title}</div>
        {doc.summary && (
          <div className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground/80">
            {doc.summary}
          </div>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          {doc.sprint != null && <span>Sprint {doc.sprint}</span>}
          {doc.priority != null && (
            <span>· {StoryPriorityLabel[doc.priority]}</span>
          )}
          {doc.category && <span>· {doc.category}</span>}
          {doc.effectiveDate && (
            <span>· Hiệu lực {formatDate(doc.effectiveDate)}</span>
          )}
          {doc.hasUnpublishedChanges && (
            <span className="text-primary">· có thay đổi chưa phát hành</span>
          )}
        </div>
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top">
        <Badge variant="secondary" className="text-[10px]">
          {DocumentStatusLabel[doc.status] ?? doc.status}
        </Badge>
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        {LifecycleStateLabel[doc.lifecycleState] ?? "—"}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        v{doc.currentVersionNumber}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        {doc.ownerName || "—"}
      </td>
      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
        {formatDate(doc.updatedAt ?? doc.createdAt)}
      </td>
    </tr>
  );
}
