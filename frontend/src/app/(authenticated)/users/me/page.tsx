'use client';

import { useState } from 'react';
import { api } from '@/src/app/lib/api-client';
import {
  UserProfileResponse,
  UpdateUserProfileRequest,
  APIError,
} from '@/src/app/lib/types';
import { useAuth } from '@/src/app/auth/auth-context';
import { Button } from '@/src/design-system/atoms/Button';
import { LightCard } from '@/src/design-system/cards';
import { H1 } from '@/src/design-system/typography/Heading';
import { P2, P3 } from '@/src/design-system/typography/Paragraph';
import { Field, Label } from '@/src/design-system/forms/Fieldset';
import { Input } from '@/src/design-system/forms/Input';

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState<UpdateUserProfileRequest>({
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const updateData: UpdateUserProfileRequest = {
        email: formData.email || undefined,
        name: formData.name || undefined,
        surname: formData.surname || undefined,
      };

      const updatedUser = await api.patch<UserProfileResponse>(
        '/users/me',
        updateData
      );

      if (updatedUser) {
        setFormData({
          name: updatedUser.name || '',
          surname: updatedUser.surname || '',
          email: updatedUser.email || '',
        });
      }

      await refreshUser();
      await refreshUser();

      setSuccess('Profil został zaktualizowany');

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Błąd podczas aktualizacji profilu');
      } else {
        setError('Błąd sieci');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <H1>Mój profil</H1>
        <P2 className="text-contentSecondary">
          Edytuj swoje dane profilowe
        </P2>
      </div>

      <div className="max-w-2xl">
        <LightCard>
          <div className="mb-8 p-4 rounded-lg bg-backgroundSecondary">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <P3 className="text-contentTertiary uppercase tracking-wide">
                  Nazwa użytkownika
                </P3>
                <p className="text-contentPrimary font-medium">
                  {user.username}
                </p>
              </div>

              <div>
                <P3 className="text-contentTertiary uppercase tracking-wide">
                  Rola
                </P3>
                <p className="text-contentPrimary font-medium">
                  {user.role === 'ADMIN'
                    ? 'Administrator'
                    : user.role === 'LECTURER'
                    ? 'Wykładowca'
                    : 'Student'}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="border border-error bg-errorSoft text-error px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="border border-success bg-successSoft text-success px-4 py-3 rounded-lg mb-6">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Field>
              <Label htmlFor="name">Imię</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="Wpisz imię"
                disabled={isLoading}
              />
            </Field>

            <Field>
              <Label htmlFor="surname">Nazwisko</Label>
              <Input
                type="text"
                id="surname"
                name="surname"
                value={formData.surname || ''}
                onChange={handleChange}
                placeholder="Wpisz nazwisko"
                disabled={isLoading}
              />
            </Field>

            <Field>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                placeholder="Wpisz email"
                disabled={isLoading}
              />
            </Field>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Aktualizowanie...' : 'Zapisz zmiany'}
              </Button>

              <Button outline href="/" className="flex-1">
                Anuluj
              </Button>
            </div>
          </form>
        </LightCard>
      </div>
    </div>
  );
}
