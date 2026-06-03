import { Link } from "@/src/design-system/atoms/Link";
import { P2 } from "@/src/design-system/typography/Paragraph";
import { ArrowLongLeftIcon } from "@heroicons/react/24/outline";

type BreadcrumbProps = {
  href: string;
  children: React.ReactNode;
};

export function Breadcrumb({ href, children }: BreadcrumbProps) {
  return (
    <Link href={href}>
      <P2 className="flex gap-2 items-center hover:underline underline-offset-2">
        <ArrowLongLeftIcon className="h-4 w-4" />
        {children}
      </P2>
    </Link>
  );
}
