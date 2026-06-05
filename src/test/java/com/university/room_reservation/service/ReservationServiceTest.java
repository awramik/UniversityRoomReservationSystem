package com.university.room_reservation.service;

import com.university.room_reservation.config.BookingLimitsProperties;
import com.university.room_reservation.dto.AvailabilityResponse;
import com.university.room_reservation.dto.ReservationDetailResponse;
import com.university.room_reservation.exception.*;
import com.university.room_reservation.model.*;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import com.university.room_reservation.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

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

    private LocalDateTime start;
    private LocalDateTime end;

    @BeforeEach
    void setUpTimes() {
        start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
        end = start.plusHours(2);
    }

    private BookingLimitsProperties.RoleLimits createLimits(int maxHours, int maxPerWeek) {
        BookingLimitsProperties.RoleLimits roleLimits = new BookingLimitsProperties.RoleLimits();
        roleLimits.setMaxDurationHours(maxHours);
        roleLimits.setMaxPerWeek(maxPerWeek);
        return roleLimits;
    }

    @Nested
    @DisplayName("Tworzenie rezerwacji")
    class TworzenieRezerwacji {

        @Test
        @DisplayName("Walidacja: Wyjątek InvalidTimeRangeException, gdy czas rozpoczęcia jest w przeszłości")
        void shouldThrowInvalidTimeRangeWhenStartInPast() {
            UUID roomId = UUID.randomUUID();
            LocalDateTime pastStart = LocalDateTime.now().minusHours(1);
            LocalDateTime futureEnd = pastStart.plusHours(2);

            assertThatThrownBy(() -> reservationService.createReservation(roomId, pastStart, futureEnd, DEFAULT_BOOKER, Role.ADMIN, DEFAULT_PURPOSE))
                    .isInstanceOf(InvalidTimeRangeException.class)
                    .hasMessage("Reservation start time must be in the future");
        }

        @Test
        @DisplayName("Walidacja: Wyjątek InvalidTimeRangeException, gdy czas zakończenia nie jest po czasie rozpoczęcia")
        void shouldThrowInvalidTimeRangeWhenEndBeforeStart() {
            UUID roomId = UUID.randomUUID();
            LocalDateTime startFuture = LocalDateTime.now().plusDays(1);
            LocalDateTime endPast = startFuture.minusMinutes(1);

            assertThatThrownBy(() -> reservationService.createReservation(roomId, startFuture, endPast, DEFAULT_BOOKER, Role.ADMIN, DEFAULT_PURPOSE))
                    .isInstanceOf(InvalidTimeRangeException.class)
                    .hasMessage("End time must be after start time");
        }

        @Test
        @DisplayName("Walidacja: Wyjątek RoomNotFoundException przy braku sali w bazie")
        void shouldThrowRoomNotFoundWhenRoomDoesNotExist() {
            UUID roomId = UUID.randomUUID();
            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, DEFAULT_BOOKER, Role.ADMIN, DEFAULT_PURPOSE))
                    .isInstanceOf(RoomNotFoundException.class)
                    .hasMessage("Room not found: " + roomId);
        }

        @Test
        @DisplayName("Walidacja: Wyjątek RoomBookingNotAllowedException, gdy student próbuje rezerwować salę przeznaczoną dla wykładowców")
        void shouldThrowRoomBookingNotAllowedWhenStudentBooksLecturerRoom() {
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.LECTURE, "Building 1");

            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.of(room));

            assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, DEFAULT_BOOKER, Role.STUDENT, DEFAULT_PURPOSE))
                    .isInstanceOf(RoomBookingNotAllowedException.class)
                    .hasMessage("Role STUDENT is not allowed to book rooms of type: LECTURE");
        }

        @Test
        @DisplayName("Limit: Wyjątek BookingLimitExceededException, gdy czas trwania przekracza limit roli")
        void shouldThrowBookingLimitExceededWhenDurationLimitExceeded() {
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.COMPUTER, "Building 1");

            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.of(room));
            when(limits.getStudent()).thenReturn(createLimits(1, 5)); // Limit to 1 hour

            assertThatThrownBy(() -> reservationService.createReservation(roomId, start, start.plusHours(2), DEFAULT_BOOKER, Role.STUDENT, DEFAULT_PURPOSE))
                    .isInstanceOf(BookingLimitExceededException.class)
                    .hasMessageContaining("exceeds maximum allowed duration");
        }

        @Test
        @DisplayName("Limit: Wyjątek BookingLimitExceededException, gdy liczba rezerwacji w tygodniu przekracza limit roli")
        void shouldThrowBookingLimitExceededWhenWeeklyCountExceeded() {
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.COMPUTER, "Building 1");

            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.of(room));
            when(limits.getStudent()).thenReturn(createLimits(4, 2)); // Limit to 2 bookings/week
            when(reservationRepository.countByBookerNameAndTypeAndStatusAndStartTimeGreaterThanEqualAndStartTimeLessThan(
                    eq(DEFAULT_BOOKER), eq(ReservationType.BOOKING), eq(ReservationStatus.ACTIVE), any(), any()))
                    .thenReturn(2L);

            assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, DEFAULT_BOOKER, Role.STUDENT, DEFAULT_PURPOSE))
                    .isInstanceOf(BookingLimitExceededException.class)
                    .hasMessageContaining("Weekly reservation limit of 2 reached");
        }

        @Test
        @DisplayName("Konflikt: Wyjątek ReservationConflictException przy nakładaniu się innej rezerwacji użytkownika")
        void shouldThrowReservationConflictWhenOverlappingBookingExists() {
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.COMPUTER, "Building 1");

            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.of(room));
            when(limits.getStudent()).thenReturn(createLimits(4, 5));
            when(reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                    eq(roomId), eq(ReservationType.BOOKING), eq(ReservationStatus.ACTIVE), any(), any()))
                    .thenReturn(true);

            assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, DEFAULT_BOOKER, Role.STUDENT, DEFAULT_PURPOSE))
                    .isInstanceOf(ReservationConflictException.class);
        }

        @Test
        @DisplayName("Konflikt: Wyjątek AdminBlockConflictException przy nakładaniu się blokady admina")
        void shouldThrowAdminBlockConflictWhenOverlappingAdminBlockExists() {
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.COMPUTER, "Building 1");

            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.of(room));
            when(limits.getStudent()).thenReturn(createLimits(4, 5));
            when(reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                    eq(roomId), eq(ReservationType.BOOKING), eq(ReservationStatus.ACTIVE), any(), any()))
                    .thenReturn(false);
            when(reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                    eq(roomId), eq(ReservationType.ADMIN_BLOCK), eq(ReservationStatus.ACTIVE), any(), any()))
                    .thenReturn(true);

            assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, DEFAULT_BOOKER, Role.STUDENT, DEFAULT_PURPOSE))
                    .isInstanceOf(AdminBlockConflictException.class);
        }

        @Test
        @DisplayName("Sukces: Pomyślne utworzenie rezerwacji przy braku konfliktów")
        void shouldCreateReservationSuccessfully() {
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.COMPUTER, "Building 1");

            when(roomRepository.findWithLockById(roomId)).thenReturn(Optional.of(room));
            when(reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                    any(), any(), any(), any(), any()))
                    .thenReturn(false);
            Reservation saved = new Reservation(room, start, end, DEFAULT_BOOKER, ReservationType.BOOKING, DEFAULT_PURPOSE);
            when(reservationRepository.save(any(Reservation.class))).thenReturn(saved);

            Reservation result = reservationService.createReservation(roomId, start, end, DEFAULT_BOOKER, Role.ADMIN, DEFAULT_PURPOSE);

            assertThat(result.getBookerName()).isEqualTo(DEFAULT_BOOKER);
            verify(reservationRepository, times(1)).save(any(Reservation.class));
        }
    }

    @Nested
    @DisplayName("Tworzenie blokady administracyjnej")
    class TworzenieBlokadyAdministracyjnej {

        @Test
        @DisplayName("Walidacja: Wyjątek InvalidTimeRangeException, gdy czas zakończenia blokady nie jest po czasie rozpoczęcia")
        void shouldThrowInvalidTimeRangeWhenAdminBlockEndBeforeStart() {
            UUID roomId = UUID.randomUUID();
            LocalDateTime startFuture = LocalDateTime.now().plusDays(1);
            LocalDateTime endPast = startFuture.minusMinutes(1);

            assertThatThrownBy(() -> reservationService.createAdminBlock(roomId, startFuture, endPast, "admin", "Maintenance"))
                    .isInstanceOf(InvalidTimeRangeException.class)
                    .hasMessage("End time must be after start time");
        }

        @Test
        @DisplayName("Walidacja: Wyjątek RoomNotFoundException przy braku sali w bazie")
        void shouldThrowRoomNotFoundWhenRoomDoesNotExistForAdminBlock() {
            UUID roomId = UUID.randomUUID();
            when(roomRepository.findById(roomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.createAdminBlock(roomId, start, end, "admin", "Maintenance"))
                    .isInstanceOf(RoomNotFoundException.class)
                    .hasMessage("Room not found: " + roomId);
        }

        @Test
        @DisplayName("Sukces: Pomyślne utworzenie blokady administracyjnej i anulowanie nakładających się rezerwacji")
        void shouldCreateAdminBlockSuccessfullyAndCancelOverlappingBookings() {
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room A", 30, RoomType.COMPUTER, "Building 1");

            when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
            Reservation block = new Reservation(room, start, end, "admin", ReservationType.ADMIN_BLOCK, "Maintenance");
            when(reservationRepository.save(any(Reservation.class))).thenReturn(block);

            Reservation studentBooking = new Reservation(room, start.plusMinutes(30), end.minusMinutes(30), DEFAULT_BOOKER, ReservationType.BOOKING, "Project");
            studentBooking.setStatus(ReservationStatus.ACTIVE);
            when(reservationRepository.findAllByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                    eq(roomId), eq(ReservationType.BOOKING), eq(ReservationStatus.ACTIVE), eq(end), eq(start)))
                    .thenReturn(List.of(studentBooking));

            Reservation result = reservationService.createAdminBlock(roomId, start, end, "admin", "Maintenance");

            assertThat(result.getBookerName()).isEqualTo("admin");
            assertThat(result.getType()).isEqualTo(ReservationType.ADMIN_BLOCK);
            assertThat(studentBooking.getStatus()).isEqualTo(ReservationStatus.CANCELLED);

            verify(reservationRepository, times(1)).save(any(Reservation.class));
            verify(reservationRepository, times(1)).saveAll(List.of(studentBooking));
        }
    }

    @Nested
    @DisplayName("Usuwanie blokady administracyjnej")
    class UsuwanieBlokadyAdministracyjnej {

        @Test
        @DisplayName("Błąd: Wyjątek ReservationNotFoundException przy próbie usunięcia nieistniejącej blokady")
        void shouldThrowReservationNotFoundWhenDeletingNonExistentAdminBlock() {
            UUID blockId = UUID.randomUUID();
            when(reservationRepository.findByIdAndType(blockId, ReservationType.ADMIN_BLOCK)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.deleteAdminBlock(blockId))
                    .isInstanceOf(ReservationNotFoundException.class)
                    .hasMessage("Rezerwacja nie znaleziona: " + blockId);
        }

        @Test
        @DisplayName("Sukces: Pomyślne usunięcie blokady administracyjnej")
        void shouldDeleteAdminBlockSuccessfully() {
            UUID blockId = UUID.randomUUID();
            Reservation block = new Reservation();
            block.setId(blockId);
            block.setType(ReservationType.ADMIN_BLOCK);

            when(reservationRepository.findByIdAndType(blockId, ReservationType.ADMIN_BLOCK)).thenReturn(Optional.of(block));

            reservationService.deleteAdminBlock(blockId);

            verify(reservationRepository, times(1)).delete(block);
        }
    }

    @Nested
    @DisplayName("Anulowanie rezerwacji")
    class AnulowanieRezerwacji {

        @Test
        @DisplayName("Błąd: Wyjątek ReservationNotFoundException przy braku rezerwacji")
        void shouldThrowReservationNotFoundWhenCancelingNonExistentReservation() {
            UUID reservationId = UUID.randomUUID();
            when(reservationRepository.findByIdAndType(reservationId, ReservationType.BOOKING)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.cancelReservation(reservationId, DEFAULT_BOOKER, false))
                    .isInstanceOf(ReservationNotFoundException.class)
                    .hasMessage("Rezerwacja nie znaleziona: " + reservationId);
        }

        @Test
        @DisplayName("Błąd: Wyjątek ReservationNotFoundException, gdy rezerwacja nie jest aktywna")
        void shouldThrowReservationNotFoundWhenCancelingInactiveReservation() {
            UUID reservationId = UUID.randomUUID();
            Reservation reservation = new Reservation();
            reservation.setStatus(ReservationStatus.CANCELLED);

            when(reservationRepository.findByIdAndType(reservationId, ReservationType.BOOKING)).thenReturn(Optional.of(reservation));

            assertThatThrownBy(() -> reservationService.cancelReservation(reservationId, DEFAULT_BOOKER, false))
                    .isInstanceOf(ReservationNotFoundException.class)
                    .hasMessage("Rezerwacja nie znaleziona: " + reservationId);
        }

        @Test
        @DisplayName("Błąd: Wyjątek AccessDeniedException, gdy użytkownik niebędący adminem próbuje anulować cudzą rezerwację")
        void shouldThrowAccessDeniedWhenNonOwnerCancelsReservation() {
            UUID reservationId = UUID.randomUUID();
            Reservation reservation = new Reservation();
            reservation.setStatus(ReservationStatus.ACTIVE);
            reservation.setBookerName("someone_else");

            when(reservationRepository.findByIdAndType(reservationId, ReservationType.BOOKING)).thenReturn(Optional.of(reservation));

            assertThatThrownBy(() -> reservationService.cancelReservation(reservationId, DEFAULT_BOOKER, false))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessage("You can only cancel your own reservations");
        }

        @Test
        @DisplayName("Sukces: Pomyślne anulowanie własnej rezerwacji przez właściciela")
        void shouldCancelReservationSuccessfullyAsOwner() {
            UUID reservationId = UUID.randomUUID();
            Reservation reservation = new Reservation();
            reservation.setStatus(ReservationStatus.ACTIVE);
            reservation.setBookerName(DEFAULT_BOOKER);

            when(reservationRepository.findByIdAndType(reservationId, ReservationType.BOOKING)).thenReturn(Optional.of(reservation));

            reservationService.cancelReservation(reservationId, DEFAULT_BOOKER, false);

            assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
            verify(reservationRepository, times(1)).save(reservation);
        }

        @Test
        @DisplayName("Sukces: Pomyślne anulowanie cudzej rezerwacji przez administratora")
        void shouldCancelReservationSuccessfullyAsAdmin() {
            UUID reservationId = UUID.randomUUID();
            Reservation reservation = new Reservation();
            reservation.setStatus(ReservationStatus.ACTIVE);
            reservation.setBookerName("someone_else");

            when(reservationRepository.findByIdAndType(reservationId, ReservationType.BOOKING)).thenReturn(Optional.of(reservation));

            reservationService.cancelReservation(reservationId, "admin", true);

            assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
            verify(reservationRepository, times(1)).save(reservation);
        }
    }

    @Nested
    @DisplayName("Pobieranie i listowanie rezerwacji")
    class PobieranieIListowanieRezerwacji {

        @Test
        @SuppressWarnings("unchecked")
        @DisplayName("Sukces: Pomyślne listowanie rezerwacji wraz z oznaczeniem przedawnionych")
        void shouldListReservationsSuccessfully() {
            when(reservationRepository.findAll(any(Specification.class))).thenReturn(List.of(new Reservation()));

            List<Reservation> result = reservationService.listReservations(LocalDate.now(), LocalDate.now().plusDays(2), UUID.randomUUID(), ReservationStatus.ACTIVE, "Alice");

            assertThat(result).hasSize(1);
            verify(reservationRepository, times(1)).markAllExpiredAsPast(any());
            verify(reservationRepository, times(1)).findAll(any(Specification.class));
        }

        @Test
        @DisplayName("Sukces: Pomyślne listowanie własnych rezerwacji użytkownika")
        void shouldListMyReservationsSuccessfully() {
            when(reservationRepository.findAllByTypeAndBookerName(ReservationType.BOOKING, "Alice")).thenReturn(List.of(new Reservation()));

            List<Reservation> result = reservationService.listMyReservations("Alice");

            assertThat(result).hasSize(1);
            verify(reservationRepository, times(1)).markAllExpiredAsPast(any());
            verify(reservationRepository, times(1)).findAllByTypeAndBookerName(ReservationType.BOOKING, "Alice");
        }

        @Test
        @DisplayName("Błąd: Wyjątek ReservationNotFoundException przy braku rezerwacji o podanym ID")
        void shouldThrowReservationNotFoundWhenGettingDetailsOfNonExistentReservation() {
            UUID id = UUID.randomUUID();
            when(reservationRepository.findByIdAndType(id, ReservationType.BOOKING)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.getReservationDetail(id, "Alice", false))
                    .isInstanceOf(ReservationNotFoundException.class)
                    .hasMessage("Rezerwacja nie znaleziona: " + id);
        }

        @Test
        @DisplayName("Błąd: Wyjątek ReservationNotFoundException, gdy nie-admin próbuje pobrać szczegóły cudzej rezerwacji")
        void shouldThrowReservationNotFoundWhenNonAdminGetsDetailsOfSomeoneElsesReservation() {
            UUID id = UUID.randomUUID();
            Reservation reservation = new Reservation();
            reservation.setBookerName("someone_else");

            when(reservationRepository.findByIdAndType(id, ReservationType.BOOKING)).thenReturn(Optional.of(reservation));

            assertThatThrownBy(() -> reservationService.getReservationDetail(id, DEFAULT_BOOKER, false))
                    .isInstanceOf(ReservationNotFoundException.class)
                    .hasMessage("Rezerwacja nie znaleziona: " + id);
        }

        @Test
        @DisplayName("Błąd: Wyjątek UserNotFoundException, gdy administrator żąda szczegółów, ale konto rezerwującego nie istnieje")
        void shouldThrowUserNotFoundWhenAdminGetsDetailsButBookerNotFound() {
            UUID id = UUID.randomUUID();
            Reservation reservation = new Reservation();
            reservation.setBookerName("deleted_user");

            when(reservationRepository.findByIdAndType(id, ReservationType.BOOKING)).thenReturn(Optional.of(reservation));
            when(userRepository.findByUsername("deleted_user")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.getReservationDetail(id, "admin", true))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessage("User not found: deleted_user");
        }

        @Test
        @DisplayName("Sukces: Zwrot pełnych informacji o rezerwacji (z obiektem booker) dla administratora")
        void shouldReturnFullReservationDetailsForAdmin() {
            UUID id = UUID.randomUUID();
            Room room = new Room("Room 1", 20, RoomType.COMPUTER, "Building 1");
            Reservation reservation = new Reservation(room, start, end, "Alice", ReservationType.BOOKING, "Study");
            User booker = new User();
            booker.setUsername("Alice");
            booker.setEmail("alice@university.com");

            when(reservationRepository.findByIdAndType(id, ReservationType.BOOKING)).thenReturn(Optional.of(reservation));
            when(userRepository.findByUsername("Alice")).thenReturn(Optional.of(booker));

            ReservationDetailResponse response = reservationService.getReservationDetail(id, "admin", true);

            assertThat(response.booker()).isNotNull();
            assertThat(response.booker().username()).isEqualTo("Alice");
            assertThat(response.purpose()).isEqualTo("Study");
        }

        @Test
        @DisplayName("Sukces: Zwrot uproszczonych informacji (bez wrażliwych danych osobowych) dla właściciela")
        void shouldReturnPublicReservationDetailsForOwner() {
            UUID id = UUID.randomUUID();
            Room room = new Room("Room 1", 20, RoomType.COMPUTER, "Building 1");
            Reservation reservation = new Reservation(room, start, end, "Alice", ReservationType.BOOKING, "Study");

            when(reservationRepository.findByIdAndType(id, ReservationType.BOOKING)).thenReturn(Optional.of(reservation));

            ReservationDetailResponse response = reservationService.getReservationDetail(id, "Alice", false);

            assertThat(response.booker()).isNull();
            assertThat(response.purpose()).isEqualTo("Study");
        }
    }

    @Nested
    @DisplayName("Sprawdzanie dostępności sal")
    class SprawdzanieDostepnosciSal {

        @Test
        @DisplayName("Walidacja: Wyjątek InvalidTimeRangeException, gdy czas zakończenia w oknie dostępności nie jest po czasie rozpoczęcia")
        void shouldThrowInvalidTimeRangeWhenCheckingAvailabilityWithEndBeforeStart() {
            UUID roomId = UUID.randomUUID();
            assertThatThrownBy(() -> reservationService.checkAvailability(roomId, end, start))
                    .isInstanceOf(InvalidTimeRangeException.class)
                    .hasMessage("End time must be after start time");
        }

        @Test
        @DisplayName("Walidacja: Wyjątek RoomNotFoundException przy braku sali w bazie")
        void shouldThrowRoomNotFoundWhenCheckingAvailabilityForNonExistentRoom() {
            UUID roomId = UUID.randomUUID();
            when(roomRepository.existsById(roomId)).thenReturn(false);

            assertThatThrownBy(() -> reservationService.checkAvailability(roomId, start, end))
                    .isInstanceOf(RoomNotFoundException.class)
                    .hasMessage("Room not found: " + roomId);
        }

        @Test
        @DisplayName("Sukces: Zwrócenie true w statusie dostępności, gdy brak aktywnych konfliktowych rezerwacji")
        void shouldCheckAvailabilitySuccessfullyWithNoConflicts() {
            UUID roomId = UUID.randomUUID();
            when(roomRepository.existsById(roomId)).thenReturn(true);
            when(reservationRepository.findAllByRoomIdAndStartTimeLessThanAndEndTimeGreaterThan(roomId, end, start))
                    .thenReturn(List.of());

            AvailabilityResponse response = reservationService.checkAvailability(roomId, start, end);

            assertThat(response.available()).isTrue();
            assertThat(response.conflicts()).isNull();
        }

        @Test
        @DisplayName("Sukces: Zwrócenie false oraz listy konfliktów, gdy istnieją aktywne rezerwacje w tym przedziale")
        void shouldCheckAvailabilitySuccessfullyWithConflicts() {
            UUID roomId = UUID.randomUUID();
            Room room = new Room("Room 1", 20, RoomType.COMPUTER, "Building 1");
            Reservation conflictBooking = new Reservation(room, start, end, "Alice", ReservationType.BOOKING, "Lecture");
            conflictBooking.setStatus(ReservationStatus.ACTIVE);

            when(roomRepository.existsById(roomId)).thenReturn(true);
            when(reservationRepository.findAllByRoomIdAndStartTimeLessThanAndEndTimeGreaterThan(roomId, end, start))
                    .thenReturn(List.of(conflictBooking));

            AvailabilityResponse response = reservationService.checkAvailability(roomId, start, end);

            assertThat(response.available()).isFalse();
            assertThat(response.conflicts()).hasSize(1);
            assertThat(response.conflicts().get(0).startTime()).isEqualTo(start);
            assertThat(response.conflicts().get(0).endTime()).isEqualTo(end);
        }
    }
}
