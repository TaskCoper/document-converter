import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ApprovalStateLabel,
  DocumentLinkTypeLabel,
  DocumentType,
  DocumentTypeLabel,
  type DocumentType as DocumentTypeValue,
  type GraphView,
} from "@/features/projects/document-types";
import {
  ExternalLinkIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useNavigate } from "react-router-dom";

const GRAPH_WIDTH = 1400;
const GRAPH_HEIGHT = 820;
const GRAPH_PADDING = 84;

const DOCUMENT_TYPES: DocumentTypeValue[] = [
  DocumentType.UserStory,
  DocumentType.Tdd,
  DocumentType.BusinessRule,
  DocumentType.UnitTest,
  DocumentType.SystemTest,
];

const TYPE_COLOR: Record<DocumentTypeValue, string> = {
  [DocumentType.UserStory]: "var(--chart-1)",
  [DocumentType.Tdd]: "var(--chart-2)",
  [DocumentType.BusinessRule]: "var(--chart-3)",
  [DocumentType.UnitTest]: "var(--chart-4)",
  [DocumentType.SystemTest]: "var(--chart-5)",
};

interface NetworkNode {
  id: string;
  docKey: string;
  docType: DocumentTypeValue | null;
  title: string;
  approvalState: number | null;
  isArchived: boolean;
  incomingCount: number;
  outgoingCount: number;
  missing: boolean;
  degree: number;
}

interface NetworkEdge {
  id: string;
  sourceId: string;
  targetId: string;
  linkType: number;
  resolved: boolean;
}

interface Point {
  x: number;
  y: number;
}

function nodeLabelWidth(node: NetworkNode) {
  return Math.max(56, node.docKey.length * 8.5);
}

function clampPosition(node: NetworkNode, position: Point) {
  const radius = nodeRadius(node);
  position.x = Math.min(
    GRAPH_WIDTH - GRAPH_PADDING - radius - nodeLabelWidth(node) - 9,
    Math.max(GRAPH_PADDING + radius, position.x),
  );
  position.y = Math.min(
    GRAPH_HEIGHT - GRAPH_PADDING - radius,
    Math.max(GRAPH_PADDING + radius, position.y),
  );
}

function isDocumentType(value: number): value is DocumentTypeValue {
  return DOCUMENT_TYPES.some((type) => type === value);
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildNetwork(graph: GraphView) {
  const nodes = new Map<string, NetworkNode>();

  for (const node of graph.nodes) {
    nodes.set(node.id, {
      ...node,
      approvalState: node.approvalState,
      missing: false,
      degree: 0,
    });
  }

  const edges: NetworkEdge[] = [];
  graph.edges.forEach((edge, index) => {
    if (!nodes.has(edge.sourceId)) return;

    const targetId = edge.targetId ?? `missing:${edge.targetDocKey}`;
    if (!nodes.has(targetId)) {
      nodes.set(targetId, {
        id: targetId,
        docKey: edge.targetDocKey,
        docType: isDocumentType(edge.targetKind) ? edge.targetKind : null,
        title: "Tài liệu chưa tồn tại",
        approvalState: null,
        isArchived: false,
        incomingCount: 0,
        outgoingCount: 0,
        missing: true,
        degree: 0,
      });
    }

    const source = nodes.get(edge.sourceId);
    const target = nodes.get(targetId);
    if (!source || !target) return;

    source.degree += 1;
    target.degree += 1;
    if (target.missing) target.incomingCount += 1;

    edges.push({
      id: `${edge.sourceId}-${targetId}-${edge.linkType}-${index}`,
      sourceId: edge.sourceId,
      targetId,
      linkType: edge.linkType,
      resolved: edge.isResolved,
    });
  });

  return { nodes: [...nodes.values()], edges };
}

function calculateLayout(nodes: NetworkNode[], edges: NetworkEdge[]) {
  const positions = new Map<string, Point>();
  const typeCenters: Record<DocumentTypeValue, Point> = {
    [DocumentType.UserStory]: { x: 430, y: 320 },
    [DocumentType.Tdd]: { x: 930, y: 300 },
    [DocumentType.BusinessRule]: { x: 680, y: 610 },
    [DocumentType.UnitTest]: { x: 1110, y: 590 },
    [DocumentType.SystemTest]: { x: 260, y: 610 },
  };

  nodes.forEach((node, index) => {
    const seed = hashString(node.id);
    const center =
      node.docType == null
        ? { x: GRAPH_WIDTH / 2, y: GRAPH_HEIGHT / 2 }
        : typeCenters[node.docType];
    const angle = ((seed % 360) * Math.PI) / 180;
    const distance = 60 + (seed % 180);
    positions.set(node.id, {
      x: center.x + Math.cos(angle) * distance + (index % 3) * 7,
      y: center.y + Math.sin(angle) * distance + (index % 5) * 5,
    });
  });

  const nodeCount = Math.max(nodes.length, 1);
  const area =
    (GRAPH_WIDTH - GRAPH_PADDING * 2) *
    (GRAPH_HEIGHT - GRAPH_PADDING * 2);
  const idealDistance = Math.sqrt(area / nodeCount) * 0.78;

  for (let iteration = 0; iteration < 220; iteration++) {
    const displacement = new Map<string, Point>();
    nodes.forEach((node) => displacement.set(node.id, { x: 0, y: 0 }));

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const left = positions.get(nodes[i].id)!;
        const right = positions.get(nodes[j].id)!;
        let dx = left.x - right.x;
        let dy = left.y - right.y;
        let distance = Math.hypot(dx, dy);
        if (distance < 1) {
          dx = ((hashString(nodes[i].id) % 11) - 5) / 5;
          dy = ((hashString(nodes[j].id) % 11) - 5) / 5;
          distance = Math.max(Math.hypot(dx, dy), 0.1);
        }
        const force = (idealDistance * idealDistance) / distance;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        const leftDisplacement = displacement.get(nodes[i].id)!;
        const rightDisplacement = displacement.get(nodes[j].id)!;
        leftDisplacement.x += fx;
        leftDisplacement.y += fy;
        rightDisplacement.x -= fx;
        rightDisplacement.y -= fy;
      }
    }

    for (const edge of edges) {
      const source = positions.get(edge.sourceId);
      const target = positions.get(edge.targetId);
      if (!source || !target) continue;
      const dx = source.x - target.x;
      const dy = source.y - target.y;
      const distance = Math.max(Math.hypot(dx, dy), 0.1);
      const force = (distance * distance) / idealDistance;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      const sourceDisplacement = displacement.get(edge.sourceId)!;
      const targetDisplacement = displacement.get(edge.targetId)!;
      sourceDisplacement.x -= fx;
      sourceDisplacement.y -= fy;
      targetDisplacement.x += fx;
      targetDisplacement.y += fy;
    }

    const temperature = 26 * (1 - iteration / 220) + 1;
    for (const node of nodes) {
      const position = positions.get(node.id)!;
      const delta = displacement.get(node.id)!;
      delta.x += (GRAPH_WIDTH / 2 - position.x) * 0.09;
      delta.y += (GRAPH_HEIGHT / 2 - position.y) * 0.09;
      const magnitude = Math.max(Math.hypot(delta.x, delta.y), 0.1);
      position.x += (delta.x / magnitude) * Math.min(magnitude, temperature);
      position.y += (delta.y / magnitude) * Math.min(magnitude, temperature);
      clampPosition(node, position);
    }
  }

  // Chừa không gian cho cả mã tài liệu, không chỉ riêng vòng tròn node.
  // Việc này tránh nhãn bị chồng hoặc bị cắt ở mép canvas sau force layout.
  for (let pass = 0; pass < 18; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const leftNode = nodes[i];
        const rightNode = nodes[j];
        const left = positions.get(leftNode.id)!;
        const right = positions.get(rightNode.id)!;
        const leftRadius = nodeRadius(leftNode);
        const rightRadius = nodeRadius(rightNode);
        const leftBounds = {
          x1: left.x - leftRadius - 5,
          x2: left.x + leftRadius + nodeLabelWidth(leftNode) + 12,
          y1: left.y - leftRadius - 5,
          y2: left.y + leftRadius + 5,
        };
        const rightBounds = {
          x1: right.x - rightRadius - 5,
          x2: right.x + rightRadius + nodeLabelWidth(rightNode) + 12,
          y1: right.y - rightRadius - 5,
          y2: right.y + rightRadius + 5,
        };
        const overlapX =
          Math.min(leftBounds.x2, rightBounds.x2) -
          Math.max(leftBounds.x1, rightBounds.x1);
        const overlapY =
          Math.min(leftBounds.y2, rightBounds.y2) -
          Math.max(leftBounds.y1, rightBounds.y1);
        if (overlapX <= 0 || overlapY <= 0) continue;

        if (overlapX <= overlapY) {
          const direction =
            left.x === right.x
              ? hashString(leftNode.id) % 2 === 0
                ? -1
                : 1
              : Math.sign(left.x - right.x);
          const offset = (overlapX + 8) / 2;
          left.x += direction * offset;
          right.x -= direction * offset;
        } else {
          const direction =
            left.y === right.y
              ? hashString(leftNode.id) % 2 === 0
                ? -1
                : 1
              : Math.sign(left.y - right.y);
          const offset = (overlapY + 8) / 2;
          left.y += direction * offset;
          right.y -= direction * offset;
        }
        clampPosition(leftNode, left);
        clampPosition(rightNode, right);
      }
    }
  }

  return positions;
}

function nodeRadius(node: NetworkNode) {
  if (node.missing) return 7;
  return Math.min(20, 9 + Math.sqrt(Math.max(node.degree, 1)) * 2.3);
}

function edgeGeometry(
  edge: NetworkEdge,
  nodesById: Map<string, NetworkNode>,
  positions: Map<string, Point>,
) {
  const sourceNode = nodesById.get(edge.sourceId)!;
  const targetNode = nodesById.get(edge.targetId)!;
  const source = positions.get(edge.sourceId)!;
  const target = positions.get(edge.targetId)!;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const ux = dx / distance;
  const uy = dy / distance;
  const x1 = source.x + ux * (nodeRadius(sourceNode) + 3);
  const y1 = source.y + uy * (nodeRadius(sourceNode) + 3);
  const x2 = target.x - ux * (nodeRadius(targetNode) + 6);
  const y2 = target.y - uy * (nodeRadius(targetNode) + 6);
  const curve = ((hashString(edge.id) % 7) - 3) * 7;
  const controlX = (x1 + x2) / 2 - uy * curve;
  const controlY = (y1 + y2) / 2 + ux * curve;
  const labelX = (x1 + 2 * controlX + x2) / 4;
  const labelY = (y1 + 2 * controlY + y2) / 4;
  return {
    path: `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`,
    labelX,
    labelY,
  };
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

export function ProjectDocumentNetwork({
  graph,
  projectId,
}: {
  graph: GraphView;
  projectId: string;
}) {
  const navigate = useNavigate();
  const { nodes, edges } = useMemo(() => buildNetwork(graph), [graph]);
  const nodesById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const positions = useMemo(() => calculateLayout(nodes, edges), [nodes, edges]);
  const [canvasRef, canvasSize] = useElementSize<HTMLDivElement>();
  const [query, setQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<DocumentTypeValue>>(
    () => new Set(DOCUMENT_TYPES),
  );

  const visibleNodeIds = useMemo(
    () =>
      new Set(
        nodes
          .filter(
            (node) => node.docType == null || activeTypes.has(node.docType),
          )
          .map((node) => node.id),
      ),
    [activeTypes, nodes],
  );
  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (edge) =>
          visibleNodeIds.has(edge.sourceId) &&
          visibleNodeIds.has(edge.targetId),
      ),
    [edges, visibleNodeIds],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const matchingNodeIds = useMemo(
    () =>
      new Set(
        nodes
          .filter(
            (node) =>
              !normalizedQuery ||
              node.docKey.toLocaleLowerCase("vi").includes(normalizedQuery) ||
              node.title.toLocaleLowerCase("vi").includes(normalizedQuery),
          )
          .map((node) => node.id),
      ),
    [nodes, normalizedQuery],
  );
  const visibleSelectedNodeId =
    selectedNodeId && visibleNodeIds.has(selectedNodeId)
      ? selectedNodeId
      : null;
  const focusNodeId = hoveredNodeId ?? visibleSelectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!focusNodeId) return null;
    const result = new Set([focusNodeId]);
    visibleEdges.forEach((edge) => {
      if (edge.sourceId === focusNodeId) result.add(edge.targetId);
      if (edge.targetId === focusNodeId) result.add(edge.sourceId);
    });
    return result;
  }, [focusNodeId, visibleEdges]);
  const selectedNode = visibleSelectedNodeId
    ? nodesById.get(visibleSelectedNodeId) ?? null
    : null;

  const fitScale = Math.max(
    0.2,
    Math.min(
      1,
      (canvasSize.width - 24) / GRAPH_WIDTH,
      (canvasSize.height - 24) / GRAPH_HEIGHT,
    ),
  );
  const initialScale =
    canvasSize.width > 0 && canvasSize.width < 640
      ? Math.max(0.5, fitScale)
      : fitScale;
  const transformKey = `${Math.round(canvasSize.width / 160)}-${Math.round(
    canvasSize.height / 160,
  )}`;

  const toggleType = (type: DocumentTypeValue) => {
    setActiveTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const selectNode = (
    event: MouseEvent<SVGGElement> | KeyboardEvent<SVGGElement>,
    node: NetworkNode,
  ) => {
    event.stopPropagation();
    setSelectedNodeId(node.id);
  };

  const openNode = (node: NetworkNode) => {
    if (!node.missing) {
      navigate(`/projects/${projectId}/documents/${node.id}`);
    }
  };

  return (
    <div className="overflow-hidden border border-border/60 bg-card">
      <div className="flex flex-col gap-3 border-b border-border/60 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-semibold">Network tài liệu</h3>
              <span className="text-[10px] text-muted-foreground">
                {nodes.length} node · {edges.length} liên kết
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Chụm/cuộn để zoom · kéo nền để di chuyển · click node để xem chi tiết
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm mã hoặc tiêu đề..."
              aria-label="Tìm node tài liệu"
              className="h-8 w-full pl-7 pr-8 text-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Xoá tìm kiếm"
                className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" aria-label="Lọc loại tài liệu">
          <Button
            type="button"
            size="sm"
            variant={activeTypes.size === DOCUMENT_TYPES.length ? "default" : "outline"}
            className="h-7 text-[10px]"
            onClick={() => setActiveTypes(new Set(DOCUMENT_TYPES))}
          >
            Tất cả
          </Button>
          {DOCUMENT_TYPES.map((type) => {
            const active = activeTypes.has(type);
            return (
              <Button
                key={type}
                type="button"
                size="sm"
                variant="outline"
                aria-pressed={active}
                className="h-7 gap-1.5 text-[10px]"
                style={
                  active
                    ? ({
                        borderColor: TYPE_COLOR[type],
                        color: TYPE_COLOR[type],
                      } as CSSProperties)
                    : undefined
                }
                onClick={() => toggleType(type)}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: TYPE_COLOR[type] }}
                />
                {DocumentTypeLabel[type]}
              </Button>
            );
          })}
          {normalizedQuery && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              {matchingNodeIds.size} kết quả
            </span>
          )}
        </div>
      </div>

      <div
        ref={canvasRef}
        className="document-network-theme relative h-[32rem] overflow-hidden bg-graph-canvas sm:h-[38rem]"
      >
        {canvasSize.width > 0 && canvasSize.height > 0 && (
          <TransformWrapper
            key={transformKey}
            initialScale={initialScale}
            minScale={Math.max(0.12, fitScale * 0.6)}
            maxScale={2.5}
            centerOnInit
            wheel={{ step: 0.08 }}
            doubleClick={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="absolute right-3 top-3 z-20 flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="border-graph-grid bg-graph-panel text-graph-label hover:bg-graph-grid hover:text-graph-label"
                    onClick={() => zoomOut()}
                    aria-label="Thu nhỏ graph"
                    title="Thu nhỏ"
                  >
                    <MinusIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="border-graph-grid bg-graph-panel text-graph-label hover:bg-graph-grid hover:text-graph-label"
                    onClick={() => zoomIn()}
                    aria-label="Phóng to graph"
                    title="Phóng to"
                  >
                    <PlusIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="border-graph-grid bg-graph-panel text-graph-label hover:bg-graph-grid hover:text-graph-label"
                    onClick={() => resetTransform()}
                    aria-label="Đưa graph về toàn cảnh"
                    title="Toàn cảnh"
                  >
                    <RotateCcwIcon className="size-3.5" />
                  </Button>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{ width: GRAPH_WIDTH, height: GRAPH_HEIGHT }}
                >
                  <svg
                    width={GRAPH_WIDTH}
                    height={GRAPH_HEIGHT}
                    viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
                    role="group"
                    aria-label="Đồ thị liên kết giữa các tài liệu trong project"
                    className="select-none"
                    onClick={() => setSelectedNodeId(null)}
                  >
                    <defs>
                      <pattern
                        id="project-graph-grid"
                        width="28"
                        height="28"
                        patternUnits="userSpaceOnUse"
                      >
                        <circle cx="1" cy="1" r="1" className="fill-graph-grid" />
                      </pattern>
                      <marker
                        id="project-graph-arrow"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="5"
                        markerHeight="5"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
                      </marker>
                      <filter id="project-graph-glow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <rect width="100%" height="100%" fill="url(#project-graph-grid)" />

                    {visibleEdges.map((edge) => {
                      const geometry = edgeGeometry(edge, nodesById, positions);
                      const active =
                        focusNodeId === edge.sourceId ||
                        focusNodeId === edge.targetId;
                      return (
                        <g key={edge.id}>
                          <path
                            d={geometry.path}
                            fill="none"
                            className="stroke-graph-edge transition-opacity duration-150"
                            strokeWidth={active ? 2 : 1.15}
                            strokeDasharray={edge.resolved ? undefined : "6 5"}
                            markerEnd="url(#project-graph-arrow)"
                            opacity={focusNodeId ? (active ? 0.9 : 0.1) : 0.46}
                          />
                          {active && (
                            <text
                              x={geometry.labelX}
                              y={geometry.labelY - 5}
                              textAnchor="middle"
                              className="pointer-events-none fill-graph-label text-[10px]"
                              stroke="var(--graph-canvas)"
                              strokeWidth="5"
                              paintOrder="stroke"
                            >
                              {DocumentLinkTypeLabel[
                                edge.linkType as keyof typeof DocumentLinkTypeLabel
                              ] ?? "Liên kết"}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {nodes.map((node) => {
                      if (!visibleNodeIds.has(node.id)) return null;
                      const position = positions.get(node.id)!;
                      const radius = nodeRadius(node);
                      const labelWidth = nodeLabelWidth(node);
                      const color =
                        node.docType == null
                          ? "var(--graph-edge)"
                          : TYPE_COLOR[node.docType];
                      const connected =
                        !connectedNodeIds || connectedNodeIds.has(node.id);
                      const queryMatch = matchingNodeIds.has(node.id);
                      const opacity = Math.min(
                        connected ? 1 : 0.14,
                        normalizedQuery && !queryMatch ? 0.16 : 1,
                      );
                      const selected = selectedNodeId === node.id;
                      const emphasized =
                        selected ||
                        hoveredNodeId === node.id ||
                        (normalizedQuery.length > 0 && queryMatch);
                      return (
                        <g
                          key={node.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`${node.docKey}: ${node.title}`}
                          className="cursor-pointer outline-none transition-opacity duration-150"
                          style={{ opacity }}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          onFocus={() => setHoveredNodeId(node.id)}
                          onBlur={() => setHoveredNodeId(null)}
                          onClick={(event) => selectNode(event, node)}
                          onDoubleClick={(event) => {
                            event.stopPropagation();
                            openNode(node);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectNode(event, node);
                            }
                          }}
                        >
                          <title>
                            {node.docKey} · {node.title}
                          </title>
                          <rect
                            x={position.x - radius - 9}
                            y={position.y - radius - 9}
                            width={radius * 2 + labelWidth + 24}
                            height={radius * 2 + 18}
                            rx={radius + 9}
                            fill="transparent"
                          />
                          <circle
                            cx={position.x}
                            cy={position.y}
                            r={radius + 9}
                            fill={color}
                            opacity={emphasized ? 0.16 : 0}
                            filter={emphasized ? "url(#project-graph-glow)" : undefined}
                          />
                          <circle
                            cx={position.x}
                            cy={position.y}
                            r={radius}
                            fill={node.missing ? "var(--graph-panel)" : color}
                            stroke={selected ? "var(--graph-label)" : color}
                            strokeWidth={selected ? 3 : node.missing ? 2 : 1.5}
                            strokeDasharray={node.missing ? "4 3" : undefined}
                          />
                          <text
                            x={position.x + radius + 7}
                            y={position.y}
                            dominantBaseline="middle"
                            className="pointer-events-none fill-graph-label font-mono text-[14px] font-medium"
                            stroke="var(--graph-canvas)"
                            strokeWidth="4"
                            paintOrder="stroke"
                          >
                            {node.docKey}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        )}

        <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-wrap gap-x-3 gap-y-1 rounded-sm border border-graph-grid bg-graph-panel/90 px-2 py-1.5 text-[9px] text-graph-label backdrop-blur-sm">
          <span>{visibleNodeIds.size} node đang hiển thị</span>
          <span className="flex items-center gap-1">
            <span className="w-4 border-t border-dashed border-graph-edge" />
            Chưa resolve
          </span>
        </div>

        {selectedNode && (
          <aside className="absolute inset-x-3 bottom-12 z-20 max-h-64 overflow-y-auto border border-graph-grid bg-graph-panel/95 p-3 text-graph-label shadow-xl backdrop-blur-md sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-14 sm:w-72">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor:
                        selectedNode.docType == null
                          ? "var(--graph-edge)"
                          : TYPE_COLOR[selectedNode.docType],
                    }}
                  />
                  <span className="font-mono text-xs font-semibold">
                    {selectedNode.docKey}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-snug">
                  {selectedNode.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Đóng chi tiết node"
                className="flex size-7 shrink-0 items-center justify-center text-graph-label/60 hover:text-graph-label"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
              <div>
                <dt className="text-graph-label/55">Loại</dt>
                <dd className="mt-0.5">
                  {selectedNode.docType == null
                    ? "Không xác định"
                    : DocumentTypeLabel[selectedNode.docType]}
                </dd>
              </div>
              <div>
                <dt className="text-graph-label/55">Phê duyệt</dt>
                <dd className="mt-0.5">
                  {selectedNode.missing
                    ? "Chưa tồn tại"
                    : selectedNode.isArchived
                      ? "Lưu trữ"
                      : ApprovalStateLabel[
                          selectedNode.approvalState as keyof typeof ApprovalStateLabel
                        ]}
                </dd>
              </div>
              <div>
                <dt className="text-graph-label/55">Liên kết vào</dt>
                <dd className="mt-0.5">{selectedNode.incomingCount}</dd>
              </div>
              <div>
                <dt className="text-graph-label/55">Liên kết ra</dt>
                <dd className="mt-0.5">{selectedNode.outgoingCount}</dd>
              </div>
            </dl>

            {selectedNode.missing ? (
              <p className="mt-3 border-t border-graph-grid pt-3 text-[10px] text-graph-label/65">
                Node nét đứt là liên kết đang trỏ tới một tài liệu chưa tồn tại.
              </p>
            ) : (
              <Button
                type="button"
                size="sm"
                className="mt-3 h-8 w-full text-xs"
                onClick={() => openNode(selectedNode)}
              >
                <ExternalLinkIcon className="size-3.5" />
                Mở tài liệu
              </Button>
            )}
          </aside>
        )}

        {visibleNodeIds.size === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-graph-canvas/80 text-xs text-graph-label">
            Bật ít nhất một loại tài liệu để hiển thị graph.
          </div>
        )}

        <span className="sr-only" aria-live="polite">
          {normalizedQuery
            ? `Tìm thấy ${matchingNodeIds.size} node phù hợp.`
            : `${visibleNodeIds.size} node đang hiển thị.`}
        </span>
      </div>
    </div>
  );
}
