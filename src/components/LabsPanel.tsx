import type { LabResult } from "../lib/types";

const flagStyle: Record<LabResult["flag"], string> = {
  high: "text-red-dark font-semibold",
  low: "text-amber font-semibold",
  normal: "text-ink",
};

const flagIcon: Record<LabResult["flag"], string> = {
  high: "↑",
  low: "↓",
  normal: "",
};

export function LabsPanel({ labs }: { labs: LabResult[] }) {
  const abnormalCount = labs.filter((l) => l.flag !== "normal").length;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Lab Results</span>
        {abnormalCount > 0 && (
          <span className="rounded bg-red-tint px-1.5 py-0.5 font-mono text-[10px] font-semibold text-red-dark">
            {abnormalCount} abnormal
          </span>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-ink-faint">
            <th className="px-3.5 py-1.5 text-left font-medium">Test</th>
            <th className="px-2 py-1.5 text-left font-medium">Result</th>
            <th className="px-3.5 py-1.5 text-left font-medium">Reference</th>
          </tr>
        </thead>
        <tbody>
          {labs.map((l) => (
            <tr key={l.id} className={`border-t border-line ${l.flag !== "normal" ? "bg-red-tint/30" : ""}`}>
              <td className="px-3.5 py-2 text-ink">{l.name}</td>
              <td className={`px-2 py-2 font-mono ${flagStyle[l.flag]}`}>
                {flagIcon[l.flag] && <span className="ml-1">{flagIcon[l.flag]}</span>}
                {l.value}
                {l.unit && <span className="text-ink-faint"> {l.unit}</span>}
              </td>
              <td className="px-3.5 py-2 font-mono text-[11px] text-ink-faint">{l.refRange}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
