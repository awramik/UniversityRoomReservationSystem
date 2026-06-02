import { H1 } from "@/src/design-system/typography/Heading";
import { P2 } from "@/src/design-system/typography/Paragraph";
import { Button } from "@/src/design-system/atoms/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-backgroundPrimary">
      <div className="text-center space-y-4">
        <H1 className="text-6xl text-contentPrimary font-bold">404</H1>
        <P2 className="text-contentSecondary">Ta strona nie istnieje</P2>

        <Button outline href="/rooms" className="mt-8">Wróć do aplikacji</Button>
      </div>
    </div>
  );
}