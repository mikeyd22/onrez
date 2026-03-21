import { Home, Map, Compass } from "lucide-react";

export const mainNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: Map },
  { href: "/explore", label: "Explore", icon: Compass },
] as const;
