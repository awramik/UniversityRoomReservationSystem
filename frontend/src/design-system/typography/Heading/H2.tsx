import { cn } from "../../utils";
import React from "react";

export function H2({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      {...props}
      className={cn(
        "text-contentPrimary text-xl leading-tight font-semibold lg:text-2xl",
        className,
      )}
    />
  );
}
