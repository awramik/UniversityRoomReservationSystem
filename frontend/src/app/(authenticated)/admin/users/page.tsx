"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/src/app/lib/api-client";
import { UserProfileResponse, APIError, USER_ROLES } from "@/src/app/lib/types";
import { useAuth } from "@/src/app/auth/auth-context";
import { P2, P3 } from "@/src/design-system/typography/Paragraph";
import { Header } from "../../_components/Header";
import { Table } from "@/src/design-system/cards/Table";
import { Badge, type BadgeColor } from "@/src/design-system/atoms/Badge";
import { Select } from "@/src/design-system/forms/Select";
import { Field, Label } from "@/src/design-system/forms/Fieldset";

const ROLE_COLORS: Record<string, BadgeColor> = {
  ADMIN: "orange",
  LECTURER: "yellow",
  STUDENT: "green",
};

export default function AdminUsersPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "role">("name");

  const didFetch = useRef(false);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = await api.get<UserProfileResponse[]>("/users");
      setUsers(data || []);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || "Błąd podczas ładowania użytkowników");
      } else {
        setError("Błąd sieci");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    if (user.role !== "ADMIN") {
      window.location.replace("/");
      return;
    }

    if (didFetch.current) return;
    didFetch.current = true;

    loadUsers();
  }, [user?.role, loadUsers]);

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === "name") {
      return `${a.name ?? ""} ${a.surname ?? ""}`.localeCompare(
        `${b.name ?? ""} ${b.surname ?? ""}`,
      );
    }
    return (a.role ?? "").localeCompare(b.role ?? "");
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <Header
        title="Użytkownicy"
        details="Zarządzanie kontami i rolami w systemie"
      />

      {/* ERROR */}
      {error && (
        <div className="border border-error bg-errorSoft text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <Field className="max-w-sm">
          <Label className="text-contentSecondary">Sortowanie</Label>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "role")}
          >
            <option value="name">Imię i nazwisko</option>
            <option value="role">Rola</option>
          </Select>
        </Field>
      )}

      {/* LOADING */}
      {isLoading && (
        <div className="py-12 text-center">
          <div className="text-contentSecondary text-sm">
            Ładowanie użytkowników...
          </div>
        </div>
      )}

      {/* EMPTY */}
      {!isLoading && users.length === 0 && (
        <div className="text-center py-10">
          <P2 className="text-contentSecondary">
            Brak użytkowników w systemie
          </P2>
        </div>
      )}

      {/* LIST */}
      {!isLoading && users.length > 0 && (
        <Table>
          <Table.Head>
            <tr>
              <Table.HeadCell>Użytkownik</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Rola</Table.HeadCell>
            </tr>
          </Table.Head>

          <Table.Body>
            {sortedUsers.map((u) => (
              <Table.Row key={u.id}>
                {/* USER */}
                <Table.Cell>
                  <div className="min-w-0 space-y-1">
                    <P2 className="font-semibold text-contentPrimary truncate">
                      {u.name} {u.surname}
                    </P2>

                    <P3 className="text-contentSecondary truncate">
                      @{u.username}
                    </P3>
                  </div>
                </Table.Cell>

                {/* EMAIL */}
                <Table.Cell className="text-contentSecondary">
                  {u.email}
                </Table.Cell>

                {/* ROLE */}
                <Table.Cell>
                  {u.role && (
                    <Badge color={ROLE_COLORS[u.role] as BadgeColor}>
                      {USER_ROLES[u.role] || u.role || "—"}
                    </Badge>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </div>
  );
}
