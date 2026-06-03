"use client";

import { useAuth } from "@/src/app/auth/auth-context";
import { Link } from "@/src/design-system/atoms/Link";
import { LightCard } from "@/src/design-system/cards";
import { H1, H2, H3 } from "@/src/design-system/typography/Heading";
import { P2, P3 } from "@/src/design-system/typography/Paragraph";

const cardClass = "border-l-4 hover:shadow-lg transition cursor-pointer h-full";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <H1 className="mb-2">Witaj, {user?.name ?? user?.username}!</H1>
        <P2 className="text-contentSecondary">
          System do rezerwacji sal uniwersyteckich
        </P2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/rooms">
          <LightCard className={`${cardClass} border-l-accentPrimary`}>
            <H2 className="mb-2">Przeglądaj sale</H2>
            <P3 className="text-contentSecondary mb-4">
              Sprawdź dostępne sale i dokonaj rezerwacji
            </P3>
            <span className="text-sm font-medium text-accentBase">
              Przejdź do sal →
            </span>
          </LightCard>
        </Link>

        <Link href="/reservations">
          <LightCard className={`${cardClass} border-l-success`}>
            <H2 className="mb-2">Moje rezerwacje</H2>
            <P3 className="text-contentSecondary mb-4">
              Przejrzyj i zarządzaj swoimi rezerwacjami
            </P3>
            <span className="text-sm font-medium text-success">
              Moje rezerwacje →
            </span>
          </LightCard>
        </Link>

        <Link href="/users/me">
          <LightCard className={`${cardClass} border-l-badgeSand`}>
            <H2 className="mb-2">Mój profil</H2>
            <P3 className="text-contentSecondary mb-4">
              Edytuj swoje dane profilowe
            </P3>
            <span className="text-sm font-medium text-accentBase">
              Profil →
            </span>
          </LightCard>
        </Link>
      </div>

      {user?.role === "ADMIN" && (
        <div className="mt-12 pt-8 border-t border-borderPrimary">
          <H2 className="mb-6">Panel administracyjny</H2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/admin/rooms">
              <LightCard className={`${cardClass} border-l-badgeClay`}>
                <H3 className="mb-2">Zarządzaj salami</H3>
                <P3 className="text-contentSecondary text-sm">
                  Twórz, edytuj i usuwaj sale
                </P3>
              </LightCard>
            </Link>

            <Link href="/admin/users">
              <LightCard className={`${cardClass} border-l-error`}>
                <H3 className="mb-2">Użytkownicy</H3>
                <P3 className="text-contentSecondary text-sm">
                  Przeglądaj listę użytkowników
                </P3>
              </LightCard>
            </Link>

            <Link href="/admin/reservations">
              <LightCard className={`${cardClass} border-l-badgeForest`}>
                <H3 className="mb-2">Wszystkie rezerwacje</H3>
                <P3 className="text-contentSecondary text-sm">
                  Zarządzaj rezerwacjami i tworz bloki
                </P3>
              </LightCard>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
