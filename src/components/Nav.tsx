import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/cases", label: "Cases" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <NavLink to="/" className="flex items-center gap-2">
          <svg viewBox="0 0 28 28" className="h-7 w-7">
            <rect width="28" height="28" rx="6" fill="var(--color-red)" />
            <path
              d="M4 15 L9 15 L11 9 L14 21 L17 12 L19 15 L24 15"
              fill="none"
              stroke="var(--color-white)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight text-ink">
            Nabd <span className="font-normal text-ink-soft">نبض</span>
          </span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-red" : "text-ink-soft hover:text-ink"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/cases"
            className="ml-1 rounded-md bg-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-dark"
          >
            Start Case
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
