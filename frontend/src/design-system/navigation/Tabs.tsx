"use client";

import { cn } from "@/src/design-system/utils";

export type TabItem<T extends string = string> = {
  key: T;
  label: string;
  disabled?: boolean;
};

type TabsProps<T extends string> = {
  items: TabItem<T>[];

  value: T;
  onChange: (value: T) => void;

  className?: string;
  tabClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  tabClassName,
  activeClassName,
  inactiveClassName,
}: TabsProps<T>) {
  return (
    <div className={cn("flex gap-2 border-borderPrimary", className)}>
      {items.map((tab) => {
        const isActive = tab.key === value;

        return (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && onChange(tab.key)}
            disabled={tab.disabled}
            className={cn(
              "px-3 py-1 text-base rounded-md transition",
              tabClassName,
              isActive
                ? cn("bg-accentPrimary/50 text-contentPrimary", activeClassName)
                : cn(
                    "text-contentSecondary hover:text-contentPrimary hover:bg-backgroundTertiary",
                    inactiveClassName,
                  ),
              tab.disabled && "opacity-40 cursor-not-allowed",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
