import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  DocumentLinkTypeLabel,
  DocumentTypeLabel,
  ErrorCodeConflictKind,
  ErrorCodeConflictKindLabel,
  LifecycleStateLabel,
  LinkIssueKind,
  LinkIssueKindLabel,
} from "@/features/projects/document-types";
import {
  useErrorCodes,
  useLinkIssues,
  useProjectGraph,
} from "@/features/projects/hooks/use-project-graph";
import { useMyProjectRole } from "@/features/projects/hooks/use-my-role";
import { canViewProject } from "@/features/projects/permissions";
import { ArrowLeftIcon, FilterIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const ISSUE_BADGE: Record<
  LinkIssueKind,
  "outline" | "secondary" | "default" | "destructive"
> = {
  [LinkIssueKind.Dangling]: "destructive",
  [LinkIssueKind.TargetArchived]: "destructive",
  [LinkIssueKind.TargetDeprecated]: "secondary",
  [LinkIssueKind.ResolvableButUnresolved]: "outline",
};

const CONFLICT_BADGE: Record<ErrorCodeConflictKind, "outline" | "destructive"> = {
  [ErrorCodeConflictKind.StatusMismatch]: "destructive",
  [ErrorCodeConflictKind.DuplicateDefinition]: "outline",
};

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return iso;
  }
};

export default function ProjectGraphPage() {
  const { projectId = "" } = useParams();
  const myRole = useMyProjectRole(projectId);

  const [staleDaysInput, setStaleDaysInput] = useState("14");
  const [staleDays, setStaleDays] = useState(14);

  const { graph, isLoading: graphLoading, isError: graphError } =
    useProjectGraph(projectId);
  const { issues, isLoading: issuesLoading, isError: issuesError } =
    useLinkIssues(projectId, staleDays);
  const { registry, isLoading: codesLoading, isError: codesError } =
    useErrorCodes(projectId);

  // docKey → documentId, để "Đích" trong bảng link có vấn đề bấm được nếu tài liệu đó vẫn tồn
  // tại (link-issues chỉ trả docKey thô, không có id đã resolve).
  const docKeyToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of graph?.nodes ?? []) map.set(node.docKey, node.id);
    return map;
  }, [graph]);

  if (!myRole || !canViewProject(myRole)) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Bạn không có quyền xem project này.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link
        to={`/projects/${projectId}/documents`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeftIcon className="size-3.5" />
        Về danh sách tài liệu
      </Link>

      <h1 className="mt-3 text-lg font-semibold text-primary">
        Đồ thị & sức khoẻ liên kết
      </h1>

      {/* Tài liệu & liên kết */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-primary">
          Tài liệu & liên kết
          {graph && (
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">
              {graph.nodes.length} tài liệu · {graph.edges.length} liên kết
            </span>
          )}
        </h2>
        <div className="mt-3">
          {graphLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : graphError ? (
            <p className="py-8 text-center text-xs text-destructive">
              Không tải được đồ thị liên kết.
            </p>
          ) : !graph || graph.nodes.length === 0 ? (
            <div className="border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
              Project chưa có tài liệu nào.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/40">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                      Mã
                    </th>
                    <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Loại
                    </th>
                    <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                      Tiêu đề
                    </th>
                    <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Vòng đời
                    </th>
                    <th className="w-14 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Vào
                    </th>
                    <th className="w-14 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Ra
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {graph.nodes.map((node) => (
                    <tr key={node.id} className="hover:bg-primary/5">
                      <td className="border border-border/40 px-2 py-1.5 align-top">
                        <Link
                          to={`/projects/${projectId}/documents/${node.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {node.docKey}
                        </Link>
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top">
                        <Badge variant="secondary" className="text-[10px]">
                          {DocumentTypeLabel[node.docType]}
                        </Badge>
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top">
                        {node.title}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
                        {LifecycleStateLabel[node.lifecycleState] ?? "—"}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
                        {node.incomingCount}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
                        {node.outgoingCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Link có vấn đề */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-primary">
            Link có vấn đề
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">
              {issues.length} link
            </span>
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">
              Coi là cũ sau (ngày)
            </span>
            <Input
              type="number"
              min={0}
              value={staleDaysInput}
              onChange={(e) => setStaleDaysInput(e.target.value)}
              className="h-7 w-16 text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={() => {
                const n = Number(staleDaysInput);
                if (Number.isFinite(n) && n >= 0) setStaleDays(n);
              }}
            >
              <FilterIcon className="size-3" />
              Lọc
            </Button>
          </div>
        </div>
        <div className="mt-3">
          {issuesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : issuesError ? (
            <p className="py-8 text-center text-xs text-destructive">
              Không tải được danh sách link có vấn đề.
            </p>
          ) : issues.length === 0 ? (
            <div className="border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
              Không có vấn đề nào về link.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/40">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                      Nguồn
                    </th>
                    <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                      Đích
                    </th>
                    <th className="w-28 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Loại link
                    </th>
                    <th className="w-40 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Vấn đề
                    </th>
                    <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                      Chi tiết
                    </th>
                    <th className="w-36 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Từ khi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue, i) => {
                    const targetId = docKeyToId.get(issue.targetDocKey);
                    return (
                      <tr
                        key={`${issue.sourceDocumentId}-${issue.targetDocKey}-${i}`}
                        className="hover:bg-primary/5"
                      >
                        <td className="border border-border/40 px-2 py-1.5 align-top">
                          <Link
                            to={`/projects/${projectId}/documents/${issue.sourceDocumentId}`}
                            className="font-mono text-primary hover:underline"
                          >
                            {issue.sourceDocKey}
                          </Link>
                        </td>
                        <td className="border border-border/40 px-2 py-1.5 align-top font-mono">
                          {targetId ? (
                            <Link
                              to={`/projects/${projectId}/documents/${targetId}`}
                              className="text-primary hover:underline"
                            >
                              {issue.targetDocKey}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              {issue.targetDocKey}
                            </span>
                          )}
                        </td>
                        <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
                          {DocumentLinkTypeLabel[issue.linkType]}
                        </td>
                        <td className="border border-border/40 px-2 py-1.5 align-top">
                          <Badge
                            variant={ISSUE_BADGE[issue.kind]}
                            className="text-[10px]"
                          >
                            {LinkIssueKindLabel[issue.kind]}
                          </Badge>
                        </td>
                        <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
                          {issue.detail}
                        </td>
                        <td className="border border-border/40 px-2 py-1.5 align-top text-muted-foreground">
                          {formatDateTime(issue.sinceAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Mã lỗi trùng */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-primary">
          Mã lỗi trùng
          {registry && (
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">
              {registry.codes.length} mã lỗi · {registry.conflicts.length} xung
              đột
            </span>
          )}
        </h2>
        <div className="mt-3">
          {codesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : codesError ? (
            <p className="py-8 text-center text-xs text-destructive">
              Không tải được danh mục mã lỗi.
            </p>
          ) : !registry || registry.conflicts.length === 0 ? (
            <div className="border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
              Không có mã lỗi nào bị trùng.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border/40">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="w-32 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Mã
                    </th>
                    <th className="w-32 border border-border/40 px-2 py-1.5 text-left font-medium">
                      Loại xung đột
                    </th>
                    <th className="border border-border/40 px-2 py-1.5 text-left font-medium">
                      Dùng ở
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registry.conflicts.map((conflict) => (
                    <tr key={conflict.code} className="hover:bg-primary/5">
                      <td className="border border-border/40 px-2 py-1.5 align-top font-mono">
                        {conflict.code}
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top">
                        <Badge
                          variant={CONFLICT_BADGE[conflict.kind]}
                          className="text-[10px]"
                        >
                          {ErrorCodeConflictKindLabel[conflict.kind]}
                        </Badge>
                      </td>
                      <td className="border border-border/40 px-2 py-1.5 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {conflict.entries.map((entry) => (
                            <Link
                              key={`${entry.documentId}-${entry.code}`}
                              to={`/projects/${projectId}/documents/${entry.documentId}`}
                              className="font-mono text-primary hover:underline"
                              title={
                                (entry.httpStatus
                                  ? `HTTP ${entry.httpStatus}`
                                  : "Không có status") +
                                (entry.description
                                  ? ` · ${entry.description}`
                                  : "")
                              }
                            >
                              {entry.docKey}
                            </Link>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
