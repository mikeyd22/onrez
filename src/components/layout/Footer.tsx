import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-gray-100/80 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Left: Logo + copyright */}
          <div className="flex items-center gap-2">
            <Image
              src="/favicon-96x96.png"
              alt="OnRez"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="text-sm text-medium-text">
              © {new Date().getFullYear()} OnRez
            </span>
          </div>

          {/* Right: Tagline */}
          <p className="text-sm text-medium-text">Built for Ontario students</p>
        </div>
      </div>
    </footer>
  );
}
