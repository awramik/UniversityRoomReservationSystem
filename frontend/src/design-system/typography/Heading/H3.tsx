import { cn } from "../../utils";
import React from "react";

export function H3({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      {...props}
      className={cn(
        "text-contentPrimary text-lg leading-tight font-semibold lg:text-xl",
        className,
      )}
    />
  );
}
