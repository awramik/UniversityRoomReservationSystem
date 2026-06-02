import * as Headless from "@headlessui/react";
import { cn } from "../../utils";

export interface LabelProps {
  className?: string;
}

export function Label({
  className,
  ...props
}: LabelProps & Omit<Headless.LabelProps, "as" | "className">) {
  return (
    <Headless.Label
      data-slot="label"
      {...props}
      className={cn(
        "select-none text-contentTertiary text-sm leading-5 data-disabled:opacity-50 sm:text-sm/6",
        className,
      )}
    />
  );
}
