import React from "react";
import { cn } from "../utils";

const colorStyles = {
  slate: "bg-slate-200/50 text-slate-800",
  gray: "bg-gray-200/50 text-gray-800",
  zinc: "bg-zinc-200/50 text-zinc-800",
  neutral: "bg-neutral-200/50 text-neutral-800",
  stone: "bg-stone-200/50 text-stone-800",

  red: "bg-red-200/50 text-red-800",
  orange: "bg-orange-200/50 text-orange-800",
  amber: "bg-amber-200/50 text-amber-800",
  yellow: "bg-yellow-200/50 text-yellow-800",
  lime: "bg-lime-200/50 text-lime-800",
  green: "bg-green-200/50 text-green-800",
  emerald: "bg-emerald-200/50 text-emerald-800",
  teal: "bg-teal-200/50 text-teal-800",
  cyan: "bg-cyan-200/50 text-cyan-800",
  sky: "bg-sky-200/50 text-sky-800",
  blue: "bg-blue-200/50 text-blue-800",
  indigo: "bg-indigo-200/50 text-indigo-800",
  violet: "bg-violet-200/50 text-violet-800",
  purple: "bg-purple-200/50 text-purple-800",
  fuchsia: "bg-fuchsia-200/50 text-fuchsia-800",
  pink: "bg-pink-200/50 text-pink-800",
  rose: "bg-rose-200/50 text-rose-800",
} as const;

export type BadgeColor = keyof typeof colorStyles;

type BadgeProps = {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
};

export function Badge({ children, color = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        colorStyles[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
