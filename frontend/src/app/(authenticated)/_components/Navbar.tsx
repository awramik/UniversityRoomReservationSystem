"use client";

import { Link } from "@/src/design-system/atoms/Link";
import { useAuth } from "@/src/app/auth/auth-context";

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  return (
    <nav className="bg-backgroundTertiary border-b border-borderSecondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl text-contentPrimary">
            System rezerwacji sal uniwersyteckich
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-8">
            <div className="flex gap-6">
              <Link
                href="/rooms"
                className="text-contentSecondary hover:text-contentPrimary transition font-medium"
              >
                Sale
              </Link>

              <Link
                href="/reservations"
                className="text-contentSecondary hover:text-contentPrimary transition font-medium"
              >
                Moje rezerwacje
              </Link>

              {/* Admin */}
              {isAdmin && (
                <div className="relative group">
                  <button className="text-contentSecondary hover:text-contentPrimary transition font-medium">
                    Panel administratora
                  </button>

                  <div className="absolute left-0 mt-0 w-52 bg-backgroundSecondary border border-borderPrimary shadow-lg rounded-md py-2 hidden group-hover:block z-50">
                    <Link
                      href="/admin/rooms"
                      className="block px-4 py-2 text-contentSecondary hover:bg-backgroundTertiary hover:text-contentPrimary"
                    >
                      Zarządzaj salami
                    </Link>

                    <Link
                      href="/admin/users"
                      className="block px-4 py-2 text-contentSecondary hover:bg-backgroundTertiary hover:text-contentPrimary"
                    >
                      Użytkownicy
                    </Link>

                    <Link
                      href="/admin/reservations"
                      className="block px-4 py-2 text-contentSecondary hover:bg-backgroundTertiary hover:text-contentPrimary"
                    >
                      Wszystkie rezerwacje
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4 border-l border-borderSecondary pl-6">
              <div className="text-right">
                <p className="text-sm font-medium text-contentPrimary">
                  {user.name} {user.surname}
                </p>
              </div>

              {/* Avatar dropdown */}
              <div className="relative group">
                <button className="w-8 h-8 rounded-full bg-accentBase text-backgroundPrimary font-bold hover:bg-accentHover transition">
                  {user?.name?.charAt(0) ??
                    user?.username?.charAt(0).toUpperCase() ??
                    "?"}
                </button>

                <div className="absolute right-0 mt-0 w-44 bg-backgroundSecondary border border-borderPrimary shadow-lg rounded-md py-2 hidden group-hover:block z-50">
                  <Link
                    href="/users/me"
                    className="block px-4 py-2 text-contentSecondary hover:bg-backgroundTertiary hover:text-contentPrimary"
                  >
                    Mój profil
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-contentSecondary hover:bg-backgroundTertiary hover:text-contentPrimary border-t border-borderPrimary"
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
