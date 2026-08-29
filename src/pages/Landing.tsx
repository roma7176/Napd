import { Link } from "react-router-dom";

const features = [
  {
    title: "Multimodal Cases",
    body: "Review vitals, labs, and imaging the way you would with a real patient.",
  },
  {
    title: "Think Aloud",
    body: "Narrate your clinical reasoning as you go — not just your final answer.",
  },
  {
    title: "AI Examiner",
    body: "Get challenged with follow-up questions built on your own reasoning.",
  },
];

export function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-12 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-[1.15] text-ink md:text-[2.75rem]">
              Train Your Clinical Reasoning.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
              Practice real clinical decision-making, think out loud under
              pressure, and defend your reasoning to an AI examiner.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/cases"
                className="rounded-md bg-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-dark"
              >
                Start Case
              </Link>
              <Link
                to="/cases"
                className="rounded-md border border-line px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-red hover:text-red"
              >
                Explore Cases
              </Link>
            </div>
          </div>

          {/* Product preview — a static mock of the actual interface, not decorative art */}
          <div className="overflow-hidden rounded-card border border-line bg-white shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="ml-2 font-mono text-[11px] text-ink-faint">nabd.app/session/pneumonia-01</span>
            </div>
            <div className="grid grid-cols-5 gap-px bg-line p-px text-[11px]">
              <div className="col-span-2 space-y-2 bg-white p-3">
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Patient</p>
                <p className="font-semibold text-ink">34M · Fever, cough</p>
                <div className="mt-2 space-y-1 font-mono text-ink-soft">
                  <p>HR 110 · SpO₂ 93%</p>
                  <p>Temp 38.9°C</p>
                </div>
              </div>
              <div className="col-span-3 space-y-2 bg-white p-3">
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">AI Examiner</p>
                <p className="rounded-md bg-red-tint px-2.5 py-2 text-red-dark">
                  Why did you rule out TB from the start?
                </p>
                <p className="rounded-md bg-surface px-2.5 py-2 text-ink">
                  I'd want to see the chest X-ray first…
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature blocks */}
      <section className="border-t border-line bg-surface/60 py-14">
        <div className="mx-auto grid max-w-6xl gap-5 px-6 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-card border border-line bg-white p-5">
              <h3 className="text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
