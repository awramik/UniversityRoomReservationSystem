'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/app/lib/api-client';
import {
  RoomResponse,
  AvailabilityResponse,
  ReservationRequest,
  APIError,
} from '@/app/lib/types';
import {
  formatDateTimeDisplay,
  parseDateTimeFromInput,
  calculateDurationHours,
} from '@/app/lib/date-utils';
import { useAuth } from '@/app/context/auth-context';
import Link from 'next/link';

const ROOM_TYPES: { [key: string]: string } = {
  LECTURE: 'Wykładowa',
  LABORATORY: 'Laboratoryjna',
  COMPUTER: 'Komputerowa',
  CONFERENCE: 'Konferencyjna',
};

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const roomId = params.id as string;

  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState('');

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [availability, setAvailability] =
    useState<AvailabilityResponse | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // =========================
  // FUNCTIONS FIRST (FIX HERE)
  // =========================

  const loadRoom = async () => {
    try {
      setIsLoadingRoom(true);
      setRoomError('');

      const data = await api.get<RoomResponse>(`/rooms/${roomId}`);
      setRoom(data);
    } catch (err) {
      if (err instanceof APIError) {
        setRoomError(err.message || 'Błąd podczas ładowania sali');
      } else {
        setRoomError('Błąd sieci');
      }
    } finally {
      setIsLoadingRoom(false);
    }
  };

  const checkAvailability = async () => {
    if (!startTime || !endTime) return;

    try {
      setIsCheckingAvailability(true);

      const params = new URLSearchParams({
        startTime: parseDateTimeFromInput(startTime),
        endTime: parseDateTimeFromInput(endTime),
      });

      const data = await api.get<AvailabilityResponse>(
        `/rooms/${roomId}/availability?${params.toString()}`
      );

      setAvailability(data);
    } catch (err) {
      console.error('Error checking availability:', err);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // =========================
  // EFFECTS
  // =========================

  useEffect(() => {
  const run = async () => {
    try {
      setIsLoadingRoom(true);
      setRoomError('');

      const data = await api.get<RoomResponse>(`/rooms/${roomId}`);
      setRoom(data);
    } catch (err) {
      if (err instanceof APIError) {
        setRoomError(err.message || 'Błąd podczas ładowania sali');
      } else {
        setRoomError('Błąd sieci');
      }
    } finally {
      setIsLoadingRoom(false);
    }
  };

  run();
}, [roomId]);

  useEffect(() => {
  const run = async () => {
    if (!startTime || !endTime) return;

    try {
      setIsCheckingAvailability(true);

      const params = new URLSearchParams({
        startTime: parseDateTimeFromInput(startTime),
        endTime: parseDateTimeFromInput(endTime),
      });

      const data = await api.get<AvailabilityResponse>(
        `/rooms/${roomId}/availability?${params.toString()}`
      );

      setAvailability(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  run();
}, [startTime, endTime, roomId]);

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError('');
    setSubmitSuccess(false);

    if (!startTime || !endTime) {
      setSubmitError('Wypełnij datę i czas');
      return;
    }

    if (!availability?.available) {
      setSubmitError('Wybrana godzina nie jest dostępna');
      return;
    }

    try {
      setIsSubmitting(true);

      const reservation: ReservationRequest = {
        roomId,
        startTime: parseDateTimeFromInput(startTime),
        endTime: parseDateTimeFromInput(endTime),
        purpose: purpose || undefined,
      };

      await api.post('/reservations', reservation);

      setSubmitSuccess(true);
      setStartTime('');
      setEndTime('');
      setPurpose('');

      setTimeout(() => {
        router.push('/reservations');
      }, 2000);
    } catch (err) {
      if (err instanceof APIError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Błąd podczas tworzenia rezerwacji');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================
  // LOADING STATES
  // =========================

  if (isLoadingRoom) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-400">
          Ładowanie sali...
        </p>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div>
        <Link href="/rooms" className="text-blue-500 hover:text-blue-600">
          ← Wróć do sal
        </Link>

        <div className="mt-4 text-red-600">{roomError || 'Brak sali'}</div>
      </div>
    );
  }

  const duration =
    startTime && endTime
      ? calculateDurationHours(
          parseDateTimeFromInput(startTime),
          parseDateTimeFromInput(endTime)
        )
      : 0;

  // =========================
  // JSX
  // =========================

  return (
    <div className="space-y-6">
      <Link href="/rooms" className="text-blue-500 hover:text-blue-600">
        ← Wróć do sal
      </Link>

      {/* reszta Twojego JSX BEZ ZMIAN */}
    </div>
  );
}
