import React, { Children, isValidElement, type ReactNode } from "react";
import { cn } from "../../utils";

export function InputGroup({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span"> & { children?: ReactNode }) {
  const hasDisabledChild = Children.toArray(children).some((child) => {
    return (
      isValidElement(child) && (child.props as { disabled?: boolean })?.disabled
    );
  });

  return (
    <span
      data-disabled={hasDisabledChild ? "true" : undefined}
      className={cn(
        "relative block w-full rounded-md",

        "has-[[data-slot=icon]:first-child]:[&_input]:pl-10",
        "has-[[data-slot=icon]:last-child]:[&_input]:pr-10",

        "*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute *:data-[slot=icon]:top-1/2 *:data-[slot=icon]:-translate-y-1/2 *:data-[slot=icon]:z-10 *:data-[slot=icon]:h-5 *:data-[slot=icon]:w-5",
        "*:data-[slot=icon]:text-stone-400",

        "[&>[data-slot=icon]:first-child]:left-3",
        "[&>[data-slot=icon]:last-child]:right-3",

        hasDisabledChild && "opacity-50 *:data-[slot=icon]:text-stone-400/50",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
