"use client";

import { useState } from "react";
import { api } from "@/src/app/lib/api-client";
import {
  UserProfileResponse,
  UpdateUserProfileRequest,
  APIError,
  USER_ROLES,
  UserRole,
} from "@/src/app/lib/types";
import { useAuth } from "@/src/app/auth/auth-context";
import { Button } from "@/src/design-system/atoms/Button";
import { Badge, type BadgeColor } from "@/src/design-system/atoms/Badge";
import { LightCard } from "@/src/design-system/cards/LightCard";
import { H2 } from "@/src/design-system/typography/Heading";
import { P2, P3 } from "@/src/design-system/typography/Paragraph";
import { Field, Label, Fieldset } from "@/src/design-system/forms/Fieldset";
import { Input } from "@/src/design-system/forms/Input";
import { Header } from "../../_components/Header";

const ROLE_COLORS: Record<UserRole, BadgeColor> = {
  ADMIN: "orange",
  LECTURER: "yellow",
  STUDENT: "green",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <P3 className="text-contentSecondary">{label}</P3>
      <div className="text-right">{value}</div>
    </div>
  );
}

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState<UpdateUserProfileRequest>({
    name: user?.name || "",
    surname: user?.surname || "",
    email: user?.email || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const updatedUser = await api.patch<UserProfileResponse>("/users/me", {
        email: formData.email || undefined,
        name: formData.name || undefined,
        surname: formData.surname || undefined,
      });

      if (updatedUser) {
        setFormData({
          name: updatedUser.name || "",
          surname: updatedUser.surname || "",
          email: updatedUser.email || "",
        });
      }

      await refreshUser();
      setSuccess("Profil został zaktualizowany");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof APIError
          ? err.message || "Błąd podczas aktualizacji profilu"
          : "Błąd sieci",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const displayName =
    [user.name, user.surname].filter(Boolean).join(" ") || user.username;

  return (
    <div className="space-y-6">
      <Header title="Mój profil" details="Edytuj swoje dane profilowe" />

      <div className="flex justify-center">
        <LightCard className="w-full max-w-2xl space-y-8">
          <div className="space-y-1">
            <H2>{displayName}</H2>
            <P3 className="text-contentTertiary font-mono">@{user.username}</P3>
          </div>

          <section className="space-y-3 border-t border-borderPrimary pt-6">
            <H2>Konto</H2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
              <Row
                label="Rola"
                value={
                  user.role ? (
                    <Badge color={ROLE_COLORS[user.role]}>
                      {USER_ROLES[user.role]}
                    </Badge>
                  ) : (
                    "—"
                  )
                }
              />
              <Row label="Login" value={<P2>{user.username}</P2>} />
            </div>
          </section>

          <section className="space-y-4 border-t border-borderPrimary pt-6">
            <H2>Dane osobowe</H2>

            {error && (
              <div className="border border-error bg-errorSoft text-error px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="border border-success bg-successSoft text-success px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <Label htmlFor="name">Imię</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </Field>
                <Field>
                  <Label htmlFor="surname">Nazwisko</Label>
                  <Input
                    id="surname"
                    name="surname"
                    value={formData.surname || ""}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </Field>
                <Field className="sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </Field>
              </Fieldset>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
                </Button>
              </div>
            </form>
          </section>
        </LightCard>
      </div>
    </div>
  );
}
