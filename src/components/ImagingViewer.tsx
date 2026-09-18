import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ImagingStudy } from "../lib/types";
import { ModalityIllustration } from "./ModalityIllustration";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface Annotation {
  id: string;
  xPct: number; // 0–1, fraction of the container — independent of actual pixel size
  yPct: number;
  note: string;
}

const modalityLabel: Record<ImagingStudy["modality"], string> = {
  xray: "X-ray",
  ct: "CT",
  ecg: "ECG",
};

export function ImagingViewer({ study }: { study: ImagingStudy }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0, moved: false });

  function clampPan(nx: number, ny: number, z: number) {
    const size = containerRef.current?.getBoundingClientRect().width ?? 0;
    const overflow = (size * z - size) / 2;
    return {
      x: Math.min(overflow, Math.max(-overflow, nx)),
      y: Math.min(overflow, Math.max(-overflow, ny)),
    };
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      moved: false,
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.moved = true;
    const next = clampPan(dragState.current.startPanX + dx, dragState.current.startPanY + dy, zoom);
    setPan(next);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState.current.dragging) return; // pointerdown started on an annotation pin, not the canvas
    const wasDrag = dragState.current.moved;
    dragState.current.dragging = false;
    if (wasDrag) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    const xPct = (relX - pan.x) / zoom / rect.width + 0.5;
    const yPct = (relY - pan.y) / zoom / rect.height + 0.5;
    if (xPct < 0 || xPct > 1 || yPct < 0 || yPct > 1) return;

    const id = `note-${Date.now()}`;
    setAnnotations((prev) => [...prev, { id, xPct, yPct, note: "" }]);
    setActiveNote(id);
    setNoteDraft("");
  }

  function zoomBy(delta: number) {
    setZoom((z) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2)));
      setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  }

  function saveNote() {
    if (!activeNote) return;
    setAnnotations((prev) => prev.map((a) => (a.id === activeNote ? { ...a, note: noteDraft.trim() } : a)));
    setActiveNote(null);
  }

  function removeAnnotation(id: string) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (activeNote === id) setActiveNote(null);
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      {/* Viewer — fixed aspect ratio, never collapses, never overflows */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => (dragState.current.dragging = false)}
        className="relative aspect-[4/3] w-full touch-none select-none overflow-hidden bg-[#0a0e1a]"
        style={{ cursor: zoom > 1 ? "grab" : "crosshair" }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center",
          }}
        >
          <ModalityIllustration modality={study.modality} />

          {annotations.map((a, i) => (
            <button
              key={a.id}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setActiveNote(a.id);
                setNoteDraft(a.note);
              }}
              className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-red font-mono text-[10px] font-bold text-white shadow"
              style={{ left: `${a.xPct * 100}%`, top: `${a.yPct * 100}%` }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Zoom / pan tools — visually attached to the viewer, not a separate block */}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/55 p-1 backdrop-blur-sm">
          <button
            onClick={() => zoomBy(-0.4)}
            className="flex h-6 w-6 items-center justify-center rounded text-sm font-bold text-white/90 transition-colors hover:bg-white/15"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-9 text-center font-mono text-[10px] text-white/70">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => zoomBy(0.4)}
            className="flex h-6 w-6 items-center justify-center rounded text-sm font-bold text-white/90 transition-colors hover:bg-white/15"
            aria-label="Zoom in"
          >
            +
          </button>
          {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="mr-0.5 rounded px-1.5 py-0.5 font-mono text-[9px] text-white/70 transition-colors hover:bg-white/15"
            >
              Reset
            </button>
          )}
        </div>

        {annotations.length > 0 && (
          <span className="absolute right-2 top-2 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] text-white/80 backdrop-blur-sm">
            {annotations.length} note{annotations.length > 1 ? "s" : ""}
          </span>
        )}

        <p className="pointer-events-none absolute bottom-2 left-1/2 w-max max-w-[92%] -translate-x-1/2 rounded-md bg-black/50 px-2.5 py-1 text-center font-mono text-[10px] text-white/70">
          Click the image to add a note
        </p>
      </div>

      {/* Modality + metadata strip — directly connected to the viewer, same card */}
      <div className="flex items-center justify-between border-t border-line px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-soft">
            {modalityLabel[study.modality]}
          </span>
          <span className="text-xs font-medium text-ink">{study.label}</span>
        </div>
      </div>

      {/* Note editor — same card, stacks vertically so it can never overflow the panel */}
      {activeNote && (
        <div className="border-t border-line bg-surface p-3">
          <p className="font-mono text-[10px] text-ink-faint">
            Note #{annotations.findIndex((a) => a.id === activeNote) + 1}
          </p>
          <input
            autoFocus
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveNote()}
            placeholder="Add a diagnostic note…"
            className="mt-1.5 w-full min-w-0 rounded-md border border-line bg-white px-3 py-1.5 text-sm outline-none focus:border-red"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => removeAnnotation(activeNote)}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-red hover:text-red"
            >
              Delete
            </button>
            <button onClick={saveNote} className="rounded-md bg-red px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-dark">
              Save
            </button>
          </div>
        </div>
      )}

      {annotations.length > 0 && !activeNote && (
        <ul className="border-t border-line px-3.5 py-2 text-xs text-ink-soft">
          {annotations.map((a, i) => (
            <li key={a.id} className="truncate">
              <span className="font-mono font-semibold text-red">#{i + 1}</span>{" "}
              {a.note || "No text — click the pin to edit"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
