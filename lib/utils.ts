import { formatDistanceToNowStrict } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string) {
  return `${formatDistanceToNowStrict(new Date(dateString), { addSuffix: false })} ago`;
}

export function createExcerpt(value: string, length = 180) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length).trimEnd()}...`;
}

export function formatDistanceMiles(distanceMiles: number | undefined) {
  if (typeof distanceMiles !== "number") {
    return null;
  }

  return `${distanceMiles.toFixed(distanceMiles < 10 ? 1 : 0)} mi`;
}

export function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugifyCommunity(city: string, stateCode: string, zipCode: string) {
  const normalizedCity = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalizedCity}-${stateCode.toLowerCase()}-${zipCode}`;
}
