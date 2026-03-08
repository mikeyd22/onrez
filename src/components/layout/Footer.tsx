import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-gray-100/80 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Left: Logo + copyright */}
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: "#3B5BDB" }}
            >
              OR
            </div>
            <span className="text-sm text-medium-text">
              © {new Date().getFullYear()} OnRez
            </span>
          </div>

          {/* Center: Nav links */}
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-medium-text hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/map"
              className="text-sm text-medium-text hover:text-primary transition-colors"
            >
              Map
            </Link>
            <Link
              href="/explore"
              className="text-sm text-medium-text hover:text-primary transition-colors"
            >
              Explore
            </Link>
          </nav>

          {/* Right */}
          <p className="text-sm text-medium-text">Built for Ontario students</p>
        </div>
      </div>
    </footer>
  );
}
