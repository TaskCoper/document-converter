import AsyncMultiSelectField from "@/components/async-multi-select-field";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { useAllRules } from "@/features/business-rules/hooks/use-all-rules";
import { useAllTdds } from "@/features/tdds/hooks/use-all-tdds";
import { useAllStories } from "@/features/user-stories/hooks/use-all-stories";
import type {
  RuleSitemapEntry,
  StorySitemapEntry,
  TddSitemapEntry,
} from "@/lib/sitemap";
import { useState } from "react";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { Schema } from "../validations";

export function ReferencesSection({ control }: { control: Control<Schema> }) {
  return (
    <FieldSet>
      <FieldLegend>Tham chiếu</FieldLegend>
      <FieldGroup>
        <TddsPicker control={control} />
        <RulesPicker control={control} />
        <DependenciesPicker control={control} />
      </FieldGroup>
    </FieldSet>
  );
}

function TddsPicker({ control }: { control: Control<Schema> }) {
  const [search, setSearch] = useState("");
  const { data: allTdds = [], isPending } = useAllTdds();

  const needle = search.trim().toLowerCase();
  const items = needle
    ? allTdds.filter(
        (t) =>
          t.id.toLowerCase().includes(needle) ||
          t.feature.toLowerCase().includes(needle),
      )
    : allTdds;

  return (
    <AsyncMultiSelectField<
      Schema,
      Schema["references"]["tdds"][number],
      TddSitemapEntry
    >
      control={control}
      name="references.tdds"
      label="Tài liệu kỹ thuật (TDDs)"
      items={items}
      isLoading={isPending}
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

function RulesPicker({ control }: { control: Control<Schema> }) {
  const [search, setSearch] = useState("");
  const { data: allRules = [], isPending } = useAllRules();

  const needle = search.trim().toLowerCase();
  const items = needle
    ? allRules.filter(
        (r) =>
          r.id.toLowerCase().includes(needle) ||
          r.name.toLowerCase().includes(needle) ||
          r.category.toLowerCase().includes(needle),
      )
    : allRules;

  return (
    <AsyncMultiSelectField<
      Schema,
      Schema["references"]["rules"][number],
      RuleSitemapEntry
    >
      control={control}
      name="references.rules"
      label="Quy tắc nghiệp vụ (Rules)"
      items={items}
      isLoading={isPending}
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

function DependenciesPicker({ control }: { control: Control<Schema> }) {
  const [search, setSearch] = useState("");
  const { data: allStories = [], isPending } = useAllStories();
  const currentId = useWatch({ control, name: "metadata.id" });

  const needle = search.trim().toLowerCase();
  const items = allStories
    .filter((s) => !currentId || s.id !== currentId)
    .filter(
      (s) =>
        !needle ||
        s.id.toLowerCase().includes(needle) ||
        s.story.toLowerCase().includes(needle),
    );

  return (
    <AsyncMultiSelectField<
      Schema,
      Schema["references"]["dependencies"][number],
      StorySitemapEntry
    >
      control={control}
      name="references.dependencies"
      label="Phụ thuộc (User Stories)"
      items={items}
      isLoading={isPending}
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
