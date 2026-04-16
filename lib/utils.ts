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

export const formatIncomeDate = (isoDate?: string) => {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length < 3) return isoDate;
  const [year, month, day] = parts;
  const monthIndex = Number(month) - 1;
  const monthName = new Date(Number(year), monthIndex).toLocaleString("es-ES", {
    month: "long",
  });
  return `${day}-${monthName}-${year}`;
};
