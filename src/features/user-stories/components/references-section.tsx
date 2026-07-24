import AsyncMultiSelectField from "@/components/async-multi-select-field";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { useAllRules } from "@/features/business-rules/hooks/use-all-rules";
import { DocumentType } from "@/features/projects/document-types";
import { useDocuments } from "@/features/projects/hooks/use-documents";
import { useAllTdds } from "@/features/tdds/hooks/use-all-tdds";
import { useAllStories } from "@/features/user-stories/hooks/use-all-stories";
import { useEffect, useState } from "react";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { Schema } from "../validations";

// Shape tối thiểu mà mỗi picker cần — TddSitemapEntry/RuleSitemapEntry/StorySitemapEntry
// (nguồn GitHub) đều là superset của các shape này, nên dùng chung được cho cả 2 nguồn.
type TddRefItem = { id: string; path: string; feature: string };
type RuleRefItem = { id: string; path: string; name: string };
type StoryRefItem = { id: string; path: string; story: string };

// Trì hoãn 300ms trước khi đổi từ khoá thực sự dùng để query — tránh gọi API mỗi phím gõ,
// giống pattern debounce của project-search-palette.tsx.
function useDebouncedValue(value: string, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function ReferencesSection({
  control,
  projectId,
}: {
  control: Control<Schema>;
  // Khi có projectId (trang sửa tài liệu trong Project mới), tìm tài liệu qua backend
  // search thay vì sitemap.md trên GitHub — 2 nguồn dữ liệu độc lập, sitemap không hề
  // chứa tài liệu của project.
  projectId?: string;
}) {
  return (
    <FieldSet>
      <FieldLegend>Tham chiếu</FieldLegend>
      <FieldGroup>
        <TddsPicker control={control} projectId={projectId} />
        <RulesPicker control={control} projectId={projectId} />
        <DependenciesPicker control={control} projectId={projectId} />
      </FieldGroup>
    </FieldSet>
  );
}

function TddsPicker({
  control,
  projectId,
}: {
  control: Control<Schema>;
  projectId?: string;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data: allTdds = [], isPending: isLegacyPending } = useAllTdds();
  const needle = search.trim().toLowerCase();
  const legacyItems = needle
    ? allTdds.filter(
        (t) =>
          t.id.toLowerCase().includes(needle) ||
          t.feature.toLowerCase().includes(needle),
      )
    : allTdds;

  const { documents: projectDocs, isLoading: isProjectLoading } =
    useDocuments(projectId, {
      docType: DocumentType.Tdd,
      keyword: debouncedSearch,
    });
  const projectItems: TddRefItem[] = projectDocs.map((d) => ({
    id: d.docKey,
    path: d.docKey,
    feature: d.title,
  }));

  const items = projectId ? projectItems : legacyItems;
  const isLoading = projectId ? isProjectLoading : isLegacyPending;

  return (
    <AsyncMultiSelectField<
      Schema,
      Schema["references"]["tdds"][number],
      TddRefItem
    >
      control={control}
      name="references.tdds"
      label="Tài liệu kỹ thuật (TDDs)"
      items={items}
      isLoading={isLoading}
      searchValue={search}
      onSearchChange={setSearch}
      placeholder="Chọn TDDs..."
      getId={(item) => item.id}
      getValueId={(v) => v.id}
      getLabel={(item) => item.id}
      createValue={(item) => ({ id: item.id, path: item.path })}
      renderOption={(item) => (
        <div className="flex flex-col min-w-0 w-full">
          <span className="font-mono text-xs">{item.id}</span>
          {item.feature && (
            <span className="text-muted-foreground text-xs truncate">
              {item.feature}
            </span>
          )}
        </div>
      )}
    />
  );
}

function RulesPicker({
  control,
  projectId,
}: {
  control: Control<Schema>;
  projectId?: string;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data: allRules = [], isPending: isLegacyPending } = useAllRules();
  const needle = search.trim().toLowerCase();
  const legacyItems = needle
    ? allRules.filter(
        (r) =>
          r.id.toLowerCase().includes(needle) ||
          r.name.toLowerCase().includes(needle) ||
          r.category.toLowerCase().includes(needle),
      )
    : allRules;

  const { documents: projectDocs, isLoading: isProjectLoading } =
    useDocuments(projectId, {
      docType: DocumentType.BusinessRule,
      keyword: debouncedSearch,
    });
  const projectItems: RuleRefItem[] = projectDocs.map((d) => ({
    id: d.docKey,
    path: d.docKey,
    name: d.title,
  }));

  const items = projectId ? projectItems : legacyItems;
  const isLoading = projectId ? isProjectLoading : isLegacyPending;

  return (
    <AsyncMultiSelectField<
      Schema,
      Schema["references"]["rules"][number],
      RuleRefItem
    >
      control={control}
      name="references.rules"
      label="Quy tắc nghiệp vụ (Rules)"
      items={items}
      isLoading={isLoading}
      searchValue={search}
      onSearchChange={setSearch}
      placeholder="Chọn Rules..."
      getId={(item) => item.id}
      getValueId={(v) => v.id}
      getLabel={(item) => item.id}
      createValue={(item) => ({ id: item.id, path: item.path })}
      renderOption={(item) => (
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-xs">{item.id}</span>
          {item.name && (
            <span className="text-muted-foreground text-xs truncate">
              {item.name}
            </span>
          )}
        </div>
      )}
    />
  );
}

function DependenciesPicker({
  control,
  projectId,
}: {
  control: Control<Schema>;
  projectId?: string;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const currentId = useWatch({ control, name: "metadata.id" });

  const { data: allStories = [], isPending: isLegacyPending } =
    useAllStories();
  const needle = search.trim().toLowerCase();
  const legacyItems = allStories
    .filter((s) => !currentId || s.id !== currentId)
    .filter(
      (s) =>
        !needle ||
        s.id.toLowerCase().includes(needle) ||
        s.story.toLowerCase().includes(needle),
    );

  const { documents: projectDocs, isLoading: isProjectLoading } =
    useDocuments(projectId, {
      docType: DocumentType.UserStory,
      keyword: debouncedSearch,
    });
  const projectItems: StoryRefItem[] = projectDocs
    .filter((d) => !currentId || d.docKey !== currentId)
    .map((d) => ({ id: d.docKey, path: d.docKey, story: d.title }));

  const items = projectId ? projectItems : legacyItems;
  const isLoading = projectId ? isProjectLoading : isLegacyPending;

  return (
    <AsyncMultiSelectField<
      Schema,
      Schema["references"]["dependencies"][number],
      StoryRefItem
    >
      control={control}
      name="references.dependencies"
      label="Phụ thuộc (User Stories)"
      items={items}
      isLoading={isLoading}
      searchValue={search}
      onSearchChange={setSearch}
      placeholder="Chọn Stories..."
      getId={(item) => item.id}
      getValueId={(v) => v.id}
      getLabel={(item) => item.id}
      createValue={(item) => ({ id: item.id, path: item.path })}
      renderOption={(item) => (
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-xs">{item.id}</span>
          {item.story && (
            <span className="text-muted-foreground text-xs truncate">
              {item.story}
            </span>
          )}
        </div>
      )}
    />
  );
}
