import { cn } from "../utils";

export const LightCard = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "bg-backgroundPrimary border border-borderPrimary h-fit rounded-xl p-6 shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
