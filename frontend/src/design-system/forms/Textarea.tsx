import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "../utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          "border outline-none transition-all duration-200 bg-white/30 text-contentPrimary mt-0.5 w-full rounded-lg px-4 py-2 min-h-[100px] focus:ring-2",
          "border-stone-400 focus:ring-accentPrimary focus:border-accentPrimary hover:border-stone-500",
          disabled && "cursor-not-allowed opacity-50 bg-gray-100",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
