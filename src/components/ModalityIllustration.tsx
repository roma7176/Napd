import type { ImagingModality } from "../lib/types";

/**
 * Stylized (non-diagnostic) illustrations standing in for real DICOM
 * studies. Each draws the finding relevant to the case's chief complaint,
 * the same way a teaching X-ray or CT slice would — the student still
 * has to interpret it. Swap for real anonymized imaging once available.
 */
export function ModalityIllustration({ modality }: { modality: ImagingModality }) {
  if (modality === "xray") {
    return (
      <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="400" fill="#0a0e1a" />
        {/* spine */}
        <line x1="200" y1="40" x2="200" y2="360" stroke="#3a4a6b" strokeWidth="10" opacity="0.6" />
        {/* ribs */}
        {[70, 105, 140, 175, 210, 245, 280].map((y) => (
          <g key={y} opacity="0.55">
            <path d={`M200 ${y} C140 ${y - 8}, 90 ${y + 10}, 60 ${y + 40}`} stroke="#7d8fb3" strokeWidth="4" fill="none" />
            <path d={`M200 ${y} C260 ${y - 8}, 310 ${y + 10}, 340 ${y + 40}`} stroke="#7d8fb3" strokeWidth="4" fill="none" />
          </g>
        ))}
        {/* heart shadow */}
        <path d="M180 150 C120 140, 110 220, 175 270 C195 285, 210 285, 205 260 C240 250, 245 170, 200 150 Z" fill="#1f2c4a" opacity="0.8" />
        {/* clavicles */}
        <path d="M120 65 C155 55, 185 55, 200 68" stroke="#8a9bc0" strokeWidth="5" fill="none" opacity="0.5" />
        <path d="M280 65 C245 55, 215 55, 200 68" stroke="#8a9bc0" strokeWidth="5" fill="none" opacity="0.5" />
        {/* consolidation — right lower lobe (image-left) */}
        <ellipse cx="130" cy="245" rx="42" ry="34" fill="#e9e4d6" opacity="0.35" />
        <ellipse cx="125" cy="250" rx="26" ry="20" fill="#e9e4d6" opacity="0.4" />
      </svg>
    );
  }

  if (modality === "ct") {
    return (
      <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="400" fill="#0a0e1a" />
        {/* abdominal wall */}
        <circle cx="200" cy="200" r="165" fill="#161c30" stroke="#3a4a6b" strokeWidth="3" />
        <circle cx="200" cy="200" r="150" fill="#101528" />
        {/* spine (posterior) */}
        <circle cx="200" cy="330" r="18" fill="#4a5a80" />
        {/* bowel loops */}
        {[
          [150, 150], [230, 140], [270, 190], [140, 210], [180, 250], [240, 260],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={22 + (i % 3) * 4} fill="#26305088" stroke="#5a6c96" strokeWidth="2" />
        ))}
        {/* inflamed appendix — right lower quadrant (image-left) */}
        <g>
          <circle cx="120" cy="270" r="30" fill="#c8553d22" />
          <path
            d="M110 255 C100 265, 100 280, 115 292 C122 298, 132 296, 133 288 C138 278, 132 262, 118 254 Z"
            fill="#c8553d" opacity="0.65"
          />
        </g>
      </svg>
    );
  }

  // ecg
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="400" fill="#12060a" />
      {/* ecg grid */}
      <g stroke="#c8553d22" strokeWidth="1">
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="400" />
        ))}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} />
        ))}
      </g>
      {/* trace with ST elevation */}
      <path
        d="M0 200 H60 L75 195 L90 205 L100 200 H130
           L140 150 L150 260 L162 195
           C180 130, 210 130, 230 195
           H260 L270 200 H400"
        fill="none"
        stroke="var(--color-red)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
