import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "../utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, disabled, ...props }, ref) => {
    const baseClasses =
      "border outline-none transition-all duration-200 bg-white/30 placeholder:text-contentTertiary mt-0.5 w-full rounded-lg px-4 py-2 focus:ring-2 appearance-none";

    const defaultClasses =
      "border-stone-400 text-contentPrimary focus:ring-accentPrimary focus:border-accentPrimary hover:border-stone-500";

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            baseClasses,
            defaultClasses,
            disabled && "cursor-default bg-gray-100 opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </select>

        {/* custom arrow */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-contentTertiary">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
