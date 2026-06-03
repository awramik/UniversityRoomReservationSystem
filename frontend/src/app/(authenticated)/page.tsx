"use client";

import { useAuth } from "@/src/app/auth/auth-context";
import { Link } from "@/src/design-system/atoms/Link";
import { LightCard } from "@/src/design-system/cards/LightCard";
import { H2, H3 } from "@/src/design-system/typography/Heading";
import { P2, P3 } from "@/src/design-system/typography/Paragraph";
import { Header } from "./_components/Header";

import {
  BuildingOfficeIcon,
  CalendarDaysIcon,
  UserIcon,
  UsersIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/24/outline";

const cardBase =
  "group h-full border border-borderPrimary bg-backgroundPrimary rounded-xl p-6 transition-transform duration-200 hover:scale-[1.02]";

const cardTitle = "font-semibold text-contentPrimary";

const cardDesc = "text-contentSecondary leading-relaxed mt-2";

const cardCTA =
  "mt-6 text-sm font-medium text-accentBase flex items-center gap-2";

function DashboardCard({
  href,
  title,
  description,
  icon: Icon,
  cta,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  cta: string;
}) {
  return (
    <Link href={href}>
      <LightCard className={cardBase}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-contentSecondary" />
              <H3 className={cardTitle}>{title}</H3>
            </div>

            <P2 className={cardDesc}>{description}</P2>

            <P3 className={cardCTA}>
              {cta} <ArrowLongRightIcon className="h-4 w-4" />
            </P3>
          </div>
        </div>
      </LightCard>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      <Header title={`Witaj, ${user?.name ?? user?.username}!`} />

      {/* USER DASHBOARD */}
      <section className="space-y-4">
        <H2>Twoja aktywność</H2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            href="/rooms"
            title="Sale"
            description="Przeglądaj dostępne sale i rezerwuj terminy."
            icon={BuildingOfficeIcon}
            cta="Przejdź"
          />

          <DashboardCard
            href="/reservations"
            title="Rezerwacje"
            description="Zarządzaj swoimi rezerwacjami i terminami."
            icon={CalendarDaysIcon}
            cta="Otwórz"
          />

          <DashboardCard
            href="/users/me"
            title="Profil"
            description="Zarządzaj swoimi danymi i ustawieniami."
            icon={UserIcon}
            cta="Edytuj"
          />
        </div>
      </section>

      {/* ADMIN DASHBOARD */}
      {user?.role === "ADMIN" && (
        <section className="space-y-4 pt-8 border-t border-borderPrimary">
          <H2>Administracja</H2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard
              href="/admin/rooms"
              title="Zarządzanie salami"
              description="Dodawaj, edytuj i usuwaj sale."
              icon={Cog6ToothIcon}
              cta="Otwórz"
            />

            <DashboardCard
              href="/admin/users"
              title="Użytkownicy"
              description="Przeglądaj i zarządzaj kontami."
              icon={UsersIcon}
              cta="Otwórz"
            />

            <DashboardCard
              href="/admin/reservations"
              title="Rezerwacje"
              description="Zarządzaj wszystkimi rezerwacjami."
              icon={ClipboardDocumentListIcon}
              cta="Otwórz"
            />
          </div>
        </section>
      )}
    </div>
  );
}
