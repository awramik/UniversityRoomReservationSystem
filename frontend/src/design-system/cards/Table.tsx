"use client";
import React from "react";
import { cn } from "../utils";
import { LightCard } from "./LightCard";
import { useRouter } from "next/navigation";

type TableProps = {
  children: React.ReactNode;
  className?: string;
};

export function Table({ children, className }: TableProps) {
  return (
    <LightCard
      className={cn("p-0! overflow-x-auto border-borderTertiary", className)}
    >
      <table className="w-full">{children}</table>
    </LightCard>
  );
}

type SectionProps = {
  children: React.ReactNode;
};

function Head({ children }: SectionProps) {
  return (
    <thead className="bg-backgroundTertiary border-b border-borderTertiary">
      {children}
    </thead>
  );
}

function Body({ children }: SectionProps) {
  return <tbody className="divide-y divide-borderPrimary">{children}</tbody>;
}

function Row({
  href,
  children,
  className,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const clickable = Boolean(href);

  return (
    <tr
      onClick={() => href && router.push(href)}
      className={cn(
        "transition",
        clickable && "cursor-pointer hover:bg-backgroundSecondary/50",
        className,
      )}
    >
      {children}
    </tr>
  );
}

function HeadCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={cn("px-6 py-3 text-sm font-semibold text-contentPrimary", {
        "text-left": align === "left",
        "text-center": align === "center",
        "text-right": align === "right",
      })}
    >
      {children}
    </th>
  );
}

function Cell({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-6 py-4",
        {
          "text-left": align === "left",
          "text-center": align === "center",
          "text-right": align === "right",
        },
        className,
      )}
    >
      {children}
    </td>
  );
}

Table.Head = Head;
Table.Body = Body;
Table.Row = Row;
Table.HeadCell = HeadCell;
Table.Cell = Cell;
