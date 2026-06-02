import { cn } from "../../utils";
import * as Headless from "@headlessui/react";

export interface FieldsetProps {
  className?: string;
}

export function Fieldset({
  className,
  ...props
}: FieldsetProps & Omit<Headless.FieldsetProps, "as" | "className">) {
  return (
    <Headless.Fieldset
      {...props}
      className={cn("flex flex-col gap-4", className)}
    />
  );
}
