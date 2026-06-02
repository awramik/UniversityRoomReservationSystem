import { cn } from "../../utils";
import React from "react";

export function P2({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      {...props}
      className={cn(
        "text-contentPrimary text-sm leading-tight font-normal lg:text-base",
        className,
      )}
    />
  );
}
