import { cn } from "../../utils";
import React from "react";

export function H1({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"h1">) {
  return (
    <h1
      {...props}
      className={cn(
        "text-contentPrimary leading-tight font-bold text-4xl md:leading-12",
        className,
      )}
    />
  );
}
