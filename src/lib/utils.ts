import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Number of avatar images in /public/images/avatars/ (avatar-1.png through avatar-N.png). */
const AVATAR_COUNT = 5;

/** Pick a random avatar path for anonymous reviews. */
export function getRandomAvatar(): string {
  const index = Math.floor(Math.random() * AVATAR_COUNT) + 1;
  return `/images/avatars/avatar-${index}.png`;
}

/** Relative date for recent reviews, full date for older (e.g. "2 months ago", "March 2026"). */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }

  return date.toLocaleDateString("en-CA", { year: "numeric", month: "long" });
}

/** Use for quantity displays (listings, reviews, ratings, rent). Defaults to 0 when from DB with no data yet. */
export function defaultQuantity(value: number | null | undefined): number {
  return value ?? 0;
}

/** Pluralize a noun based on count: "1 listing" vs "5 listings". */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
