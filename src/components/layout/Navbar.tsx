"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, Map, Compass, Menu, X, ChevronDown, Bookmark, List, PlusCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: Map },
  { href: "/explore", label: "Explore", icon: Compass },
];

interface NavbarProps {
  user: User | null;
  profile: { display_name: string | null; avatar_url: string | null } | null;
}

export function Navbar({ user, profile }: NavbarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Account";

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/60 bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] shadow-sm"
      style={{ background: "linear-gradient(to right, #EEF2FF, #E0E7FF)" }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/favicon-96x96.png"
            alt="OnRez"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="text-lg font-semibold text-dark-text">OnRez</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-medium text-medium-text hover:bg-white/60 hover:text-dark-text transition-all duration-200"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-dark-text hover:bg-white/60 transition-all"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: "#3B5BDB" }}
                  >
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span>{displayName}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-52 rounded-lg border border-border bg-white shadow-lg py-1 z-50">
                  <Link
                    href="/bookmarks"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-dark-text hover:bg-gray-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Bookmark className="h-4 w-4" />
                    My Bookmarks
                  </Link>
                  <Link
                    href="/my-listings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-dark-text hover:bg-gray-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <List className="h-4 w-4" />
                    My Listings
                  </Link>
                  <Link
                    href="/listing/new"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-dark-text hover:bg-gray-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Post a Listing
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-dark-text hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-medium-text hover:text-primary transition-colors"
              >
                Log in
              </Link>
              <Button
                asChild
                className="rounded-lg text-white font-medium"
                style={{ backgroundColor: "#3B5BDB" }}
              >
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-medium-text hover:bg-white/60"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      <div
        className={cn(
          "md:hidden border-t border-border/60 bg-white/95 backdrop-blur",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col px-4 py-3 gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-medium text-dark-text hover:bg-gray-100"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
            {user ? (
              <>
                <Link href="/bookmarks" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-dark-text hover:bg-gray-100">
                  My Bookmarks
                </Link>
                <Link href="/my-listings" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-dark-text hover:bg-gray-100">
                  My Listings
                </Link>
                <Link href="/listing/new" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-dark-text hover:bg-gray-100">
                  Post a Listing
                </Link>
                <button type="button" onClick={() => { handleLogout(); setMobileOpen(false); }} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-left text-dark-text hover:bg-gray-100">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-dark-text hover:bg-gray-100">
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center rounded-lg bg-primary py-2.5 text-[15px] font-medium text-white"
                  style={{ backgroundColor: "#3B5BDB" }}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
