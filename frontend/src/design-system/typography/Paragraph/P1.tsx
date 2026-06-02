import { cn } from "../../utils";
import React from "react";

export function P1({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      {...props}
      className={cn(
        "text-contentPrimary text-base leading-tight font-normal lg:text-lg",
        className,
      )}
    />
  );
}
