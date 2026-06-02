import { cn } from "../utils";

export const DarkCard = ({
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
        "bg-backgroundTertiary border border-borderTertiary h-fit flex-1 rounded-xl p-6 shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
