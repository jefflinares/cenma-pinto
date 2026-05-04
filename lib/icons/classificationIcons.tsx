import React from "react";

// Map of icon names to SVG React elements
export const iconMap: Record<string, React.ReactNode> = {
  tomate: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="15" r="7" fill="#FF6347" />
      <path d="M12 8v4" stroke="#228B22" strokeWidth="3" />
    </svg>
  ),
  pimiento: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 4c0-1 1-2 2-2h4c1 0 2 1 2 2v12c0 4-4 6-4 6s-4-2-4-6V4z" fill="#8B0000" />
    </svg>
  ),
  pepino: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="12" rx="3" ry="8" fill="#32CD32" />
      <path d="M9 4v16" stroke="#228B22" />
      <path d="M15 4v16" stroke="#228B22" />
    </svg>
  ),
};

export function getIcon(iconName?: string): React.ReactNode {
  if (!iconName) return null;
  return iconMap[iconName] || null;
}
