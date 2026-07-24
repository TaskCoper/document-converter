import { DocumentTypeLabel } from "@/features/projects/document-types";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Radial "hub-and-spoke" graph: tài liệu đang sửa nằm giữa, các tài liệu liên quan (tham
// chiếu ra/vào, bị ảnh hưởng) là vệ tinh xung quanh, nối bằng đường thẳng có mũi tên chỉ
// hướng quan hệ. Tự vẽ bằng SVG (không thêm thư viện đồ thị) — foreignObject cho node để
// dùng được <Link> điều hướng SPA bình thường, đo kích thước container bằng ResizeObserver
// để viewBox khớp 1:1 pixel thật (chữ trong node không bị mờ do co giãn).

export type GraphEdgeKind = "outgoing" | "incoming" | "impact";

export interface GraphSatellite {
  key: string;
  kind: GraphEdgeKind;
  docKey: string;
  title?: string;
  docType?: number;
  href?: string;
  // Nhãn ngắn hiển thị trực tiếp trên cạnh (đủ hẹp để lọt vào khoảng trống giữa 2 node).
  edgeLabel: string;
  // Chi tiết đầy đủ (vd "cách 2 bước · ... · đã phát hành") — chỉ hiện khi hover (title).
  edgeDetail?: string;
}

const EDGE_STYLE: Record<
  GraphEdgeKind,
  { stroke: string; dash?: string; markerId: string }
> = {
  outgoing: { stroke: "var(--primary)", markerId: "rg-arrow-outgoing" },
  incoming: { stroke: "var(--foreground)", markerId: "rg-arrow-incoming" },
  impact: {
    stroke: "var(--destructive)",
    dash: "4 3",
    markerId: "rg-arrow-impact",
  },
};

function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function NodeCard({
  href,
  docKey,
  title,
  docType,
  isCurrent,
}: {
  href?: string;
  docKey: string;
  title?: string;
  docType?: number;
  isCurrent?: boolean;
}) {
  const content = (
    <div
      className={
        "flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-sm border px-2 py-1 text-center leading-tight " +
        (isCurrent
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:border-primary/60")
      }
    >
      {docType != null && (
        <span className="w-full truncate text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
          {DocumentTypeLabel[docType as keyof typeof DocumentTypeLabel] ??
            "?"}
        </span>
      )}
      <span
        className={
          "w-full truncate font-mono text-[10px] " +
          (isCurrent ? "font-semibold text-primary" : "text-foreground")
        }
      >
        {docKey}
      </span>
      {title && (
        <span className="w-full truncate text-[9px] text-muted-foreground">
          {title}
        </span>
      )}
    </div>
  );

  if (!href) return content;
  return (
    <Link to={href} className="block h-full w-full">
      {content}
    </Link>
  );
}

export function RelatedDocumentsGraph({
  current,
  satellites,
}: {
  current: { docKey: string; title?: string; docType?: number };
  satellites: GraphSatellite[];
}) {
  const [wrapRef, measuredWidth] = useMeasuredWidth<HTMLDivElement>();
  const w = measuredWidth || 1;
  const n = satellites.length;
  const cx = w / 2;

  // Chiều cao node CỐ ĐỊNH (đủ cho 3 dòng text cỡ chữ cố định: loại tài liệu + docKey + tiêu
  // đề) — không co theo bề rộng container như chiều rộng, vì cỡ chữ (px) không co giãn theo.
  // Chỉ nodeW co lại trên màn hẹp (chữ dài thì tự truncate/ellipsis, không tràn).
  const NODE_H = 48;
  const CENTER_H = 54;
  const CENTER_W_RATIO = 1.08;

  const angles =
    n > 0
      ? satellites.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2)
      : [];
  const sumHH = (NODE_H + CENTER_H) / 2;
  const CLEARANCE_MARGIN = 1.1;

  // Bán kính cần đủ để node vệ tinh không đè lên node trung tâm lẫn nhau. Chiều rộng scale
  // theo nodeW (tuyến tính) còn chiều cao thì cố định — không quy được về "radius = nodeW * hệ
  // số" gọn như trước nữa, nên dò nhị phân nodeW lớn nhất (≤140) vừa khít bán kính khả dụng.
  const requiredRadiusFor = (nodeW: number) => {
    const centerW = nodeW * CENTER_W_RATIO;
    const sumHW = (nodeW + centerW) / 2;
    let req = 0;
    for (const angle of angles) {
      const c = Math.abs(Math.cos(angle));
      const s = Math.abs(Math.sin(angle));
      const rx = c > 1e-4 ? sumHW / c : Infinity;
      const ry = s > 1e-4 ? sumHH / s : Infinity;
      req = Math.max(req, Math.min(rx, ry) * CLEARANCE_MARGIN);
    }
    if (n >= 2) {
      req = Math.max(req, (nodeW * 1.05) / (2 * Math.sin(Math.PI / n)));
    }
    return req;
  };

  // Bán kính chỉ giới hạn theo BỀ RỘNG đo được — chiều cao KHÔNG phải input mà là OUTPUT (suy
  // ra từ bán kính thật cần dùng, xem bên dưới). Tránh vòng lặp phụ thuộc chiều-cao-quyết-định-
  // bán-kính, bán-kính-quyết-định-chiều-cao, và tránh hộp đồ thị cao cố định dù chỉ có 1-2 vệ
  // tinh (trước đây cao theo tỉ lệ bề rộng, lãng phí diện tích khi ít tài liệu liên quan).
  const containerRadius = Math.max(30, w / 2 - 6);
  let nodeW = 56;
  if (n > 0) {
    let lo = 56;
    let hi = 140;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (requiredRadiusFor(mid) <= containerRadius) lo = mid;
      else hi = mid;
    }
    nodeW = lo;
  } else {
    nodeW = 140;
  }
  const nodeH = NODE_H;
  const centerW = nodeW * CENTER_W_RATIO;
  const centerH = CENTER_H;
  // Dùng hết khoảng trống còn thừa của container (nếu nodeW đã kịch trần 140 mà containerRadius
  // còn dư) để nới rộng khoảng cách giữa các node — chỗ cho nhãn cạnh, đỡ chật khi chỉ vừa đủ
  // không đè lên nhau.
  const radius = Math.min(containerRadius, requiredRadiusFor(nodeW) * 1.15);

  // Chiều cao hộp = đúng bằng khoảng đồ thị thực sự chiếm (2×bán kính + nửa-chiều-cao node xa
  // nhất) — không hơn, để hộp co lại khi ít vệ tinh thay vì luôn chiếm hết chiều cao tối đa.
  // KHÔNG áp trần cố định ở đây: trần sẽ cắt cụt hộp mà không thu nhỏ bán kính theo, khiến
  // node tràn ra ngoài viewBox và đè lên phần chú thích render ngay dưới.
  const height = Math.max(
    140,
    Math.round(2 * (radius + Math.max(nodeH, centerH) / 2) + 24),
  );
  const cy = height / 2;

  // Với mỗi vệ tinh: tính điểm đường nối THOÁT khỏi biên ô trung tâm (borderStart) và điểm
  // CHẠM biên ô vệ tinh (borderEnd) — để vẽ line/mũi tên dừng đúng ở viền, không cắm vào giữa
  // nội dung ô. Cùng công thức "khoảng cách theo tia tới biên hình chữ nhật" dùng cho cả tính
  // bán kính lẫn đặt nhãn ở trên.
  const geom = satellites.map((s, i) => {
    const angle = angles[i];
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const c = Math.abs(cosA);
    const sn = Math.abs(sinA);
    const centerExit = Math.min(
      c > 1e-4 ? centerW / 2 / c : Infinity,
      sn > 1e-4 ? centerH / 2 / sn : Infinity,
    );
    const satExit = Math.min(
      c > 1e-4 ? nodeW / 2 / c : Infinity,
      sn > 1e-4 ? nodeH / 2 / sn : Infinity,
    );
    const satEnter = Math.max(centerExit, radius - satExit);
    const labelDist =
      radius - satExit > centerExit
        ? (centerExit + (radius - satExit)) / 2
        : centerExit + 6;
    return {
      ...s,
      x: cx + radius * cosA,
      y: cy + radius * sinA,
      borderStartX: cx + centerExit * cosA,
      borderStartY: cy + centerExit * sinA,
      borderEndX: cx + satEnter * cosA,
      borderEndY: cy + satEnter * sinA,
      labelX: cx + labelDist * cosA,
      labelY: cy + labelDist * sinA,
    };
  });

  return (
    <div ref={wrapRef} className="w-full">
      {measuredWidth > 0 && (
        <svg
          width={w}
          height={height}
          viewBox={`0 0 ${w} ${height}`}
          className="overflow-visible"
        >
          <defs>
            {(Object.keys(EDGE_STYLE) as GraphEdgeKind[]).map((kind) => (
              <marker
                key={kind}
                id={EDGE_STYLE[kind].markerId}
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={EDGE_STYLE[kind].stroke} />
              </marker>
            ))}
          </defs>

          {geom.map((s) => {
            const style = EDGE_STYLE[s.kind];
            // Line dừng đúng ở viền ô (borderStart/borderEnd), không cắm vào nội dung. Chiều
            // vẽ theo đúng chiều quan hệ ngữ nghĩa: outgoing/impact từ trung tâm ra vệ tinh,
            // incoming từ vệ tinh vào trung tâm — mũi tên (markerEnd) luôn nằm ở đầu "đích".
            const [x1, y1, x2, y2] =
              s.kind === "incoming"
                ? [s.borderEndX, s.borderEndY, s.borderStartX, s.borderStartY]
                : [s.borderStartX, s.borderStartY, s.borderEndX, s.borderEndY];
            return (
              <line
                key={`edge-${s.key}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={style.stroke}
                strokeWidth={1.25}
                strokeDasharray={style.dash}
                markerEnd={`url(#${style.markerId})`}
                opacity={0.75}
              />
            );
          })}

          {geom.map((s) => (
            <foreignObject
              key={`label-${s.key}`}
              x={s.labelX - 36}
              y={s.labelY - 7}
              width={72}
              height={14}
            >
              <div
                className="flex justify-center"
                title={s.edgeDetail ?? s.edgeLabel}
              >
                <span className="truncate rounded-sm bg-background/90 px-1 text-[7px] leading-[14px] text-muted-foreground">
                  {s.edgeLabel}
                </span>
              </div>
            </foreignObject>
          ))}

          {geom.map((s) => (
            <foreignObject
              key={`node-${s.key}`}
              x={s.x - nodeW / 2}
              y={s.y - nodeH / 2}
              width={nodeW}
              height={nodeH}
            >
              <NodeCard
                href={s.href}
                docKey={s.docKey}
                title={s.title}
                docType={s.docType}
              />
            </foreignObject>
          ))}

          <foreignObject
            x={cx - centerW / 2}
            y={cy - centerH / 2}
            width={centerW}
            height={centerH}
          >
            <NodeCard
              docKey={current.docKey}
              title={current.title}
              docType={current.docType}
              isCurrent
            />
          </foreignObject>
        </svg>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-px w-4 bg-primary" />
          Tham chiếu đến
        </span>
        <span className="flex items-center gap-1">
          <span className="h-px w-4 bg-foreground" />
          Trỏ vào tài liệu này
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-4 border-t border-dashed border-destructive"
            aria-hidden
          />
          Bị ảnh hưởng
        </span>
      </div>
    </div>
  );
}
