'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api-client';
import { LoginRequest, LoginResponse, APIError } from '@/app/lib/types';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/design-system/atoms/Button';
import { H1 } from '@/design-system/typography/Heading';
import { P2, P3 } from '@/design-system/typography/Paragraph';
import { Field, Label } from "@/design-system/forms/Fieldset";
import { LightCard } from "@/design-system/cards";
import { Input } from "@/design-system/forms/Input";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser, user, isLoading: authLoading } = useAuth();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/rooms');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginRequest: LoginRequest = { username, password };
      const response = await api.post<LoginResponse>('/auth/login', loginRequest);

      if (response?.token) {
        localStorage.setItem('token', response.token);
        await refreshUser();
        router.push('/rooms');
      } else {
        setError('Nie udało się zalogować. Spróbuj ponownie.');
      }
    } catch (err) {
      if (err instanceof APIError) {
        if (err.status === 401) {
          setError('Nieprawidłowy login lub hasło');
        } else {
          setError(err.message || 'Błąd logowania');
        }
      } else {
        setError('Błąd sieci. Sprawdź połączenie z serwerem.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">        
        <LightCard className='space-y-6'>
          
          <header className="text-center space-y-2">
            <H1>Rezerwacja Sal</H1>
            <P2 className="text-sm text-contentSecondary">
              Zaloguj się, aby zarządzać rezerwacjami sal
            </P2>
          </header>

          {/* TODO: fix unexpected error message */}
          {error && (
            <div className="mb-6 rounded-lg border border-error bg-errorSoft px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">            
            <Field>
              <Label>
                Username
              </Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="student"
                required
              />
            </Field>

            <Field>
              <Label>
                Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logowanie...
                </span>
              ) : (
                'Zaloguj się'
              )}
            </Button>
          </form>
        </LightCard>

        <P3 className="text-center text-contentTertiary">
          System rezerwacji sal uniwersyteckich
        </P3>
      </div>
    </div>
  );
}
