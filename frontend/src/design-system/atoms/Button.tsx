import { cn } from "../utils";
import * as Headless from "@headlessui/react";
import React from "react";
import { Link } from "./Link";

type Size = "base" | "sm";

const sizeStyles = {
  base: "px-6 py-2 text-base",
  sm: "px-3 py-1 text-sm",
} as const;

const baseStyles =
  "inline-flex items-center justify-center font-medium rounded-lg w-fit text-nowrap transition-colors hover:cursor-default transition duration-200";

const variantStyles = {
  default: {
    base: "bg-buttonColor border-buttonColor border-1 text-buttonText custom-shadow",
    hover: "hover:bg-buttonColorHover",
  },
  outline: {
    base: "border-1 border-borderSecondary text-buttonGhostText",
    hover: "hover:bg-buttonGhostHover",
  },
  plain: {
    base: "border-1 border-transparent text-contentTertiary",
    hover: "hover:bg-buttonGhostHover",
  },
  destructive: {
    base: "bg-buttonDestructive border-1 border-buttonDestructive text-buttonDestructiveText custom-shadow",
    hover: "hover:bg-buttonDestructiveHover",
  },
  outlineDestructive: {
    base: "border-1 border-buttonDestructive text-buttonDestructive bg-buttonDestructive/5",
    hover: "hover:bg-buttonDestructive/10",
  },
} as const;

type VariantFlags =
  | {
      outline?: true;
      plain?: never;
      destructive?: never;
      outlineDestructive?: never;
    }
  | {
      outline?: never;
      plain?: true;
      destructive?: never;
      outlineDestructive?: never;
    }
  | {
      outline?: never;
      plain?: never;
      destructive?: true;
      outlineDestructive?: never;
    }
  | {
      outline?: never;
      plain?: never;
      destructive?: never;
      outlineDestructive?: true;
    }
  | {
      outline?: never;
      plain?: never;
      destructive?: never;
      outlineDestructive?: never;
    };

type BaseButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  disabled?: boolean;
  size?: Size;
} & Omit<Headless.ButtonProps, "as" | "className">;

type ButtonProps = BaseButtonProps & VariantFlags;

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  function Button(
    {
      children,
      className,
      href,
      disabled = false,
      outline,
      plain,
      destructive,
      outlineDestructive,
      size = "base",
      ...props
    },
    ref,
  ) {
    let activeVariant: keyof typeof variantStyles = "default";

    if (outline) activeVariant = "outline";
    else if (plain) activeVariant = "plain";
    else if (destructive) activeVariant = "destructive";
    else if (outlineDestructive) activeVariant = "outlineDestructive";

    const variantClass = variantStyles[activeVariant];

    const classes = cn(
      baseStyles,
      sizeStyles[size],
      variantClass.base,
      variantClass.hover,
      disabled && "opacity-50 hover:cursor-default pointer-events-none",
      className,
    );

    if (href) {
      return (
        <Link
          href={href}
          className={classes}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {children}
        </Link>
      );
    }

    return (
      <Headless.Button
        {...props}
        className={classes}
        ref={ref}
        disabled={disabled}
      >
        {children}
      </Headless.Button>
    );
  },
);
