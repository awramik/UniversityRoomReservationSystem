"use client";

import { Link } from "@/src/design-system/atoms/Link";
import { useAuth } from "@/src/app/auth/auth-context";
import { H3 } from "@/src/design-system/typography/Heading";
import { P2, P3 } from "@/src/design-system/typography/Paragraph";
import { cn } from "@/src/design-system/utils";

const baseNavLink =
  "text-contentSecondary hover:text-contentPrimary transition py-2";

const dropdownItem =
  "block px-4 py-2 text-contentSecondary hover:bg-backgroundTertiary hover:text-contentPrimary transition";

const adminLinks = [
  { href: "/admin/rooms", label: "Zarządzaj salami" },
  { href: "/admin/users", label: "Użytkownicy" },
  { href: "/admin/reservations", label: "Wszystkie rezerwacje" },
];

const mainLinks = [
  { href: "/rooms", label: "Sale" },
  { href: "/reservations", label: "Moje rezerwacje" },
];

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  const userInitial =
    user?.name?.charAt(0) ?? user?.username?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <nav className="bg-backgroundTertiary border-b border-borderSecondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* LOGO */}
          <Link href="/">
            <H3 className="font-bold text-contentSecondary">
              System rezerwacji sal uniwersyteckich
            </H3>
          </Link>

          {/* NAV */}
          <div className="flex items-center gap-8">
            <div className="flex gap-6">
              {mainLinks.map((item) => (
                <Link key={item.href} href={item.href}>
                  <P2 className={baseNavLink}>{item.label}</P2>
                </Link>
              ))}

              {/* ADMIN */}
              {isAdmin && (
                <div className="relative group">
                  <P2 className={cn("cursor-default", baseNavLink)}>
                    Panel administratora
                  </P2>

                  <div className="absolute left-0 mt-0 w-52 bg-backgroundSecondary border border-borderPrimary shadow-lg rounded-md py-2 hidden group-hover:block z-50">
                    {adminLinks.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <P2 className={dropdownItem}>{item.label}</P2>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* USER */}
            <div className="flex items-center gap-4 border-l border-borderSecondary pl-6">
              <div className="text-right">
                <P3 className="text-sm font-medium text-contentPrimary">
                  {user.name} {user.surname}
                </P3>
              </div>

              {/* AVATAR */}
              <div className="relative group">
                <button className="w-8 h-8 rounded-full bg-accentBase text-backgroundPrimary font-bold hover:bg-accentHover transition">
                  {userInitial}
                </button>

                <div className="absolute right-0 mt-0 w-44 bg-backgroundSecondary border border-borderPrimary shadow-lg rounded-md py-2 hidden group-hover:block z-50">
                  <Link href="/users/me" className={dropdownItem}>
                    Mój profil
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-error hover:bg-backgroundTertiary border-t border-borderPrimary transition"
                  >
                    Wyloguj się
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
