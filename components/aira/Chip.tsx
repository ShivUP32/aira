import type { ReactNode } from "react";

export function Chip({
  children,
  active,
  tone = "default",
}: {
  children: ReactNode;
  active?: boolean;
  tone?: "default" | "source" | "success" | "saffron";
}) {
  return (
    <span className={`aira-chip ${active ? "is-active" : ""} tone-${tone}`}>
      {children}
    </span>
  );
}
