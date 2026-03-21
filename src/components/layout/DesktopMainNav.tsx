"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mainNavLinks } from "@/lib/main-nav-links";

interface DesktopMainNavProps {
  className?: string;
}

/** Same markup/classes as the center pill on the main Navbar (md+). */
export function DesktopMainNav({ className }: DesktopMainNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "hidden md:flex bg-white/70 backdrop-blur-md rounded-full px-2 py-1.5 shadow-sm border border-white/50",
        className
      )}
      aria-label="Main"
    >
      <div className="flex items-center gap-1">
        {mainNavLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
