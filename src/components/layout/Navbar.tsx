"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Map,
  Compass,
  Menu,
  ChevronDown,
  Bookmark,
  List,
  PlusCircle,
  MessageSquare,
  LogOut,
} from "lucide-react";
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
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Account";
  const initials = displayName.slice(0, 2).toUpperCase();
  const isHome = pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left — Logo + OnRez (same glass pill as menu bar, aligned on same line) */}
        <Link
          href="/"
          className="flex items-center gap-1.5 shrink-0 bg-white/70 backdrop-blur-md rounded-full pl-2.5 pr-4 py-2 -translate-y-0.5 shadow-sm border border-white/50 hover:bg-white/90 transition-colors"
        >
          <Image
            src="/web-app-manifest-192x192.png"
            alt="OnRez"
            width={20}
            height={20}
            className="w-5 h-5 rounded-lg object-contain shrink-0"
          />
          <span className="text-sm font-medium text-gray-900">
            OnRez
          </span>
        </Link>

        {/* Center — Frosted pill nav (desktop) */}
        <nav className="hidden md:flex bg-white/70 backdrop-blur-md rounded-full px-2 py-1.5 shadow-sm border border-white/50">
          <div className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(href);
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

        {/* Right — Auth / User menu (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 bg-white/70 backdrop-blur-md rounded-full pl-1.5 pr-3 py-1.5 shadow-sm border border-white/50 hover:bg-white/90 transition-colors"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">{displayName}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 py-2 z-50">
                  <Link
                    href="/bookmarks"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/80"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Bookmark className="h-4 w-4" />
                    My Bookmarks
                  </Link>
                  <Link
                    href="/my-reviews"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/80"
                    onClick={() => setMenuOpen(false)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    My Reviews
                  </Link>
                  <Link
                    href="/my-listings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/80"
                    onClick={() => setMenuOpen(false)}
                  >
                    <List className="h-4 w-4" />
                    My Listings
                  </Link>
                  <Link
                    href="/listing/new"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/80"
                    onClick={() => setMenuOpen(false)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Post a Listing
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-primary text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-primary/90 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className={cn(
            "md:hidden flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/30",
            isHome ? "text-white" : "text-gray-700"
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 p-4 z-50">
          <nav className="flex flex-col gap-2">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-700 hover:bg-white/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <hr className="my-3 border-gray-200" />
          {user ? (
            <>
              <Link
                href="/bookmarks"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/60"
              >
                <Bookmark className="h-4 w-4" />
                My Bookmarks
              </Link>
              <Link
                href="/my-reviews"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/60"
              >
                <MessageSquare className="h-4 w-4" />
                My Reviews
              </Link>
              <Link
                href="/my-listings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/60"
              >
                <List className="h-4 w-4" />
                My Listings
              </Link>
              <Link
                href="/listing/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/60"
              >
                <PlusCircle className="h-4 w-4" />
                Post a Listing
              </Link>
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 text-left"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-white/60 text-center"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-full text-sm font-medium text-white bg-primary hover:bg-primary/90 text-center"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
