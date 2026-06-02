import { cn } from "../utils";
import * as Headless from "@headlessui/react";
import React from "react";
import { Link } from "./Link";

const baseStyles =
  "inline-flex items-center justify-center font-medium rounded-lg px-6 py-2 w-fit text-base text-nowrap transition-colors hover:cursor-default";

const variantStyles = {
  default: {
    base: "bg-buttonColor border-buttonColor border-1 text-buttonText custom-shadow",
    hover: "hover:bg-buttonColorHover transition duration-200",
  },
  outline: {
    base: "border-1 border-borderSecondary text-buttonGhostText transition duration-200",
    hover: "hover:bg-buttonGhostHover",
  },
  plain: {
    base: "border-1 border-transparent py-1 text-contentTertiary transition duration-200",
    hover: "",
  },
  destructive: {
    base: "bg-actionDestructive border-1 border-borderDestructive text-contentInverted custom-shadow",
    hover: "hover:brightness-105 transition duration-200",
  },
  outlineDestructive: {
    base: "border-1 border-borderDestructive text-contentDestructive bg-actionDestructive/5",
    hover: "hover:brightness-105 transition duration-200",
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
