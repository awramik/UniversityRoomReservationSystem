import { cn } from "../../utils";
import React from "react";

export function P3({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      {...props}
      className={cn(
        "text-contentPrimary text-xs leading-tight font-normal lg:text-sm",
        className,
      )}
    />
  );
}
