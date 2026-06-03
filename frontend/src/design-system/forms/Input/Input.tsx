import { cn } from "../../utils";
import { type InputHTMLAttributes, forwardRef } from "react";

const InputVariant = {
  DEFAULT: "default",
  ERROR: "error",
} as const;

export type InputVariantType = (typeof InputVariant)[keyof typeof InputVariant];

export type InputStyleProps = {
  variant?: InputVariantType;
};

type InputProps = InputStyleProps & InputHTMLAttributes<HTMLInputElement>;

const getInputClasses = (variant: InputVariantType) => {
  const baseClasses =
    "border outline-none transition-all duration-200 bg-white/30 placeholder:text-contentTertiary mt-0.5 w-full rounded-lg px-4 py-2 outline-none focus:ring-2 transition cursor-default";

  switch (variant) {
    case InputVariant.ERROR:
      return cn(
        baseClasses,
        "border-contentError text-red-800",
        "focus:ring-red-500 focus:border-red-500",
        "hover:border-red-500/80",
      );
    case InputVariant.DEFAULT:
    default:
      return cn(
        baseClasses,
        "border-stone-400 text-contentPrimary",
        "focus:ring-accentPrimary focus:border-accentPrimary",
        "hover:border-stone-500",
      );
  }
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { variant = InputVariant.DEFAULT, className, disabled, readOnly, ...props },
    ref,
  ) => {
    const internalVariant =
      variant === "error" ? InputVariant.ERROR : InputVariant.DEFAULT;
    const inputClasses = getInputClasses(internalVariant);
    const isInteractive = !disabled && !readOnly;

    return (
      <input
        ref={ref}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          inputClasses,
          !isInteractive && "cursor-not-allowed bg-gray-100 opacity-50",
          disabled && "cursor-not-allowed",
          readOnly && "cursor-default",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
