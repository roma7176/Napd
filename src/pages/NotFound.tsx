import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-ink-soft">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="mt-5 inline-block rounded-md bg-red px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-dark"
      >
        Back to Home
      </Link>
    </div>
  );
}
