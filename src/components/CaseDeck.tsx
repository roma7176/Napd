import { useState } from "react";
import type { CaseAssets } from "../lib/types";
import { ImagingViewer } from "./ImagingViewer";
import { LabsPanel } from "./LabsPanel";

export function CaseDeck({ assets }: { assets: CaseAssets }) {
  const tabs = [
    ...(assets.imaging.length ? (["imaging"] as const) : []),
    ...(assets.labs.length ? (["labs"] as const) : []),
  ];
  const [tab, setTab] = useState<"imaging" | "labs">(tabs[0] ?? "labs");

  if (tabs.length === 0) return null;

  return (
    <div className="space-y-3">
      {tabs.length > 1 && (
        <div className="flex gap-1.5">
          <button
            onClick={() => setTab("imaging")}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
              tab === "imaging" ? "bg-red text-white" : "border border-line text-ink-soft hover:border-red/40"
            }`}
          >
            Imaging
          </button>
          <button
            onClick={() => setTab("labs")}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
              tab === "labs" ? "bg-red text-white" : "border border-line text-ink-soft hover:border-red/40"
            }`}
          >
            Labs
          </button>
        </div>
      )}

      {tab === "imaging" &&
        assets.imaging.map((study) => <ImagingViewer key={study.id} study={study} />)}
      {tab === "labs" && <LabsPanel labs={assets.labs} />}
    </div>
  );
}
