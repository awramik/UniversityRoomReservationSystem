import { cn } from "../../utils";
import * as Headless from "@headlessui/react";

export interface ErrorMessageProps {
  className?: string;
}

export function ErrorMessage({
  className,
  ...props
}: ErrorMessageProps & Omit<Headless.DescriptionProps, "as" | "className">) {
  return (
    <Headless.Description
      data-slot="error"
      {...props}
      className={cn(
        "text-error text-sm data-disabled:opacity-50 mt-1",
        className,
      )}
    />
  );
}
