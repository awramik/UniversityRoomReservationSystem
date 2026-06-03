import React from "react";
import { H1 } from "@/src/design-system/typography/Heading";
import { P1 } from "@/src/design-system/typography/Paragraph";

type HeaderProps = {
  title: React.ReactNode;
  details?: React.ReactNode;
  children?: React.ReactNode;
};

export function Header({ title, details, children }: HeaderProps) {
  return (
    <div className="flex items-end justify-between border-b border-borderPrimary pb-6">
      <div className="space-y-2">
        <H1>{title}</H1>

        {details && <P1 className="text-contentSecondary">{details}</P1>}
      </div>

      {children}
    </div>
  );
}
