package com.university.room_reservation.service;

import com.university.room_reservation.config.BookingLimitsProperties;
import com.university.room_reservation.exception.AdminBlockConflictException;
import com.university.room_reservation.exception.ReservationConflictException;
import com.university.room_reservation.exception.RoomNotFoundException;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.model.ReservationType;
import com.university.room_reservation.model.Role;
import com.university.room_reservation.model.Room;
import com.university.room_reservation.model.RoomType;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import com.university.room_reservation.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Serwis rezerwacji - testy jednostkowe Mockito")
class ReservationServiceTest {

    private static final String DEFAULT_BOOKER = "Alice";
    private static final String DEFAULT_PURPOSE = "lecture";

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingLimitsProperties limits;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private final LocalDateTime start = LocalDateTime.of(2027, 5, 10, 10, 0);
    private final LocalDateTime end   = LocalDateTime.of(2027, 5, 10, 12, 0);

    @Nested
    @DisplayName("Tworzenie rezerwacji - przypadki błędne")
    class PrzypadkiBledne {

        @Test
        @DisplayName("Walidacja: Wyjątek RoomNotFoundException przy braku sali w bazie")
        void shouldThrowRoomNotFoundWhenRoomDoesNotExist() {
            // Sprawdza, czy próba rezerwacji nieistniejącej sali rzuca wyjątek RoomNotFoundException.
            UUID roomId = UUID.randomUUID();
            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, DEFAULT_BOOKER, Role.ADMIN, DEFAULT_PURPOSE))
                    .isInstanceOf(RoomNotFoundException.class);
        }

        @Test
        @DisplayName("Konflikt: Wyjątek ReservationConflictException przy nakładaniu się innej rezerwacji")
        void shouldThrowReservationConflictWhenOverlappingBookingExists() {
            // Sprawdza, czy nakładanie się innej rezerwacji użytkownika rzuca wyjątek ReservationConflictException.
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.LECTURE, "Building 1");

            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.of(room));
            when(reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                    eq(roomId), eq(ReservationType.BOOKING), eq(ReservationStatus.ACTIVE), any(), any()))
                    .thenReturn(true);

            assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, DEFAULT_BOOKER, Role.ADMIN, DEFAULT_PURPOSE))
                    .isInstanceOf(ReservationConflictException.class);
        }

        @Test
        @DisplayName("Konflikt: Wyjątek AdminBlockConflictException przy nakładaniu się blokady admina")
        void shouldThrowAdminBlockConflictWhenOverlappingAdminBlockExists() {
            // Sprawdza, czy nakładanie się blokady administracyjnej (ADMIN_BLOCK) rzuca wyjątek AdminBlockConflictException.
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.LECTURE, "Building 1");

            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.of(room));
            when(reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                    eq(roomId), eq(ReservationType.BOOKING), eq(ReservationStatus.ACTIVE), any(), any()))
                    .thenReturn(false);
            when(reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                    eq(roomId), eq(ReservationType.ADMIN_BLOCK), eq(ReservationStatus.ACTIVE), any(), any()))
                    .thenReturn(true);

            assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, DEFAULT_BOOKER, Role.ADMIN, DEFAULT_PURPOSE))
                    .isInstanceOf(AdminBlockConflictException.class);
        }
    }

    @Nested
    @DisplayName("Tworzenie rezerwacji - przypadek pomyślny")
    class PrzypadekPomyslny {

        @Test
        @DisplayName("Sukces: Pomyślne utworzenie rezerwacji przy braku konfliktów")
        void shouldCreateReservationSuccessfully() {
            // Sprawdza, czy brak jakichkolwiek konfliktów pozwala na prawidłowy zapis rezerwacji.
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.LECTURE, "Building 1");

            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.of(room));
            when(reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                    any(), any(), any(), any(), any()))
                    .thenReturn(false);
            Reservation saved = new Reservation(room, start, end, DEFAULT_BOOKER, ReservationType.BOOKING, DEFAULT_PURPOSE);
            when(reservationRepository.save(any())).thenReturn(saved);

            Reservation result = reservationService.createReservation(roomId, start, end, DEFAULT_BOOKER, Role.ADMIN, DEFAULT_PURPOSE);

            assertThat(result.getBookerName()).isEqualTo(DEFAULT_BOOKER);
        }
    }
}
