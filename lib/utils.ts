import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDDMMYYYYtoYYYYMMDD(dateStr: string) {
  const [dd, mm, yyyy] = dateStr.split("/");
  if (dd && mm && yyyy) {
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}
