import { cn } from "../../utils";
import * as Headless from "@headlessui/react";

export interface FieldProps {
  className?: string;
}

export function Field({
  className,
  ...props
}: FieldProps & Omit<Headless.FieldProps, "as" | "className">) {
  return (
    <Headless.Field
      {...props}
      className={cn(
        "[&>[data-slot=control]+[data-slot=error]]:mt-1",
        className,
      )}
    />
  );
}
