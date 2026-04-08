"use client";

import { useEffect, useRef, useState } from "react";

type DataPoint = { date: string; count: number };

type TooltipState = { x: number; y: number; point: DataPoint } | null;

function bezierPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function areaPath(points: { x: number; y: number }[], height: number): string {
  if (points.length < 2) return "";
  const line = bezierPath(points);
  return `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
}

function formatDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${parseInt(day)}/${parseInt(month)}`;
}

export function LeadsChart({
  clientId,
  days = 30,
  color = "#6366f1",
}: {
  clientId: string;
  days?: number;
  color?: string;
}) {
  const [data, setData]       = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const svgRef               = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/leads-chart?clientId=${clientId}&days=${days}`)
      .then((r) => r.json())
      .then((d) => setData(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId, days]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const maxVal = Math.max(...data.map((d) => d.count), 1);

  // SVG dimensions
  const W = 600;
  const H = 160;
  const PAD = { top: 12, right: 12, bottom: 28, left: 28 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + chartH - (d.count / maxVal) * chartH,
  }));

  // Y axis ticks
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  // X axis: show ~6 labels max
  const step = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data
    .map((d, i) => ({ label: formatDate(d.date), i }))
    .filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">לידים — {days} ימים אחרונים</span>
        <span className="text-xs font-semibold text-blue-600">{total} סה"כ</span>
      </div>
      <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full overflow-visible"
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id={`fill-${clientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Y gridlines */}
          {yTicks.map((tick) => {
            const y = PAD.top + chartH - (tick / maxVal) * chartH;
            return (
              <g key={tick}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{tick}</text>
              </g>
            );
          })}

          {/* Area fill */}
          {pts.length >= 2 && (
            <path
              d={areaPath(pts, PAD.top + chartH)}
              fill={`url(#fill-${clientId})`}
            />
          )}

          {/* Bezier line */}
          {pts.length >= 2 && (
            <path
              d={bezierPath(pts)}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots + hover areas */}
          {pts.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={tooltip?.point === data[i] ? 5 : 3.5}
                fill={tooltip?.point === data[i] ? color : "#fff"}
                stroke={color}
                strokeWidth={2}
                style={{ transition: "r 0.1s, fill 0.1s" }}
              />
              {/* Invisible large hit area */}
              <rect
                x={pt.x - 12}
                y={PAD.top}
                width={24}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setTooltip({ x: pt.x, y: pt.y, point: data[i] })}
              />
            </g>
          ))}

          {/* X axis labels */}
          {xLabels.map(({ label, i }) => (
            <text
              key={i}
              x={pts[i]?.x ?? 0}
              y={H - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#94a3b8"
            >
              {label}
            </text>
          ))}

          {/* Tooltip */}
          {tooltip && (
            <g>
              <line
                x1={tooltip.x}
                y1={PAD.top}
                x2={tooltip.x}
                y2={PAD.top + chartH}
                stroke={color}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.5}
              />
              <rect
                x={tooltip.x < W / 2 ? tooltip.x + 8 : tooltip.x - 88}
                y={tooltip.y - 24}
                width={80}
                height={26}
                rx={5}
                fill="#1e293b"
                opacity={0.9}
              />
              <text
                x={tooltip.x < W / 2 ? tooltip.x + 48 : tooltip.x - 48}
                y={tooltip.y - 11}
                textAnchor="middle"
                fontSize={10}
                fill="#fff"
                fontWeight="600"
              >
                {tooltip.point.count} ליד
              </text>
              <text
                x={tooltip.x < W / 2 ? tooltip.x + 48 : tooltip.x - 48}
                y={tooltip.y - 1}
                textAnchor="middle"
                fontSize={8.5}
                fill="#94a3b8"
              >
                {formatDate(tooltip.point.date)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
