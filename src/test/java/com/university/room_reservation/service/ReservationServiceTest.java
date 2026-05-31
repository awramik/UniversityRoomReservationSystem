package com.university.room_reservation.service;

import com.university.room_reservation.exception.AdminBlockConflictException;
import com.university.room_reservation.exception.ReservationConflictException;
import com.university.room_reservation.exception.RoomNotFoundException;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.Room;
import com.university.room_reservation.model.ReservationType;
import com.university.room_reservation.model.RoomType;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private final LocalDateTime start = LocalDateTime.of(2026, 5, 10, 10, 0);
    private final LocalDateTime end   = LocalDateTime.of(2026, 5, 10, 12, 0);

    @Test
    void shouldThrowRoomNotFoundWhenRoomDoesNotExist() {
        UUID roomId = UUID.randomUUID();
        when(roomRepository.findById(roomId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, "Alice", "lecture"))
                .isInstanceOf(RoomNotFoundException.class);
    }

    @Test
    void shouldThrowReservationConflictWhenOverlappingBookingExists() {
        UUID roomId = UUID.randomUUID();
        Room room = new Room("Room A", 30, RoomType.LECTURE, "Building 1");

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(reservationRepository.existsByRoomIdAndTypeAndStartTimeLessThanAndEndTimeGreaterThan(
                eq(roomId), eq(ReservationType.BOOKING), any(), any()))
                .thenReturn(true);

        assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, "Alice", "lecture"))
                .isInstanceOf(ReservationConflictException.class);
    }

    @Test
    void shouldThrowAdminBlockConflictWhenOverlappingAdminBlockExists() {
        UUID roomId = UUID.randomUUID();
        Room room = new Room("Room A", 30, RoomType.LECTURE, "Building 1");

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(reservationRepository.existsByRoomIdAndTypeAndStartTimeLessThanAndEndTimeGreaterThan(
                eq(roomId), eq(ReservationType.BOOKING), any(), any()))
                .thenReturn(false);
        when(reservationRepository.existsByRoomIdAndTypeAndStartTimeLessThanAndEndTimeGreaterThan(
                eq(roomId), eq(ReservationType.ADMIN_BLOCK), any(), any()))
                .thenReturn(true);

        assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, "Alice", "lecture"))
                .isInstanceOf(AdminBlockConflictException.class);
    }

    @Test
    void shouldCreateReservationSuccessfully() {
        UUID roomId = UUID.randomUUID();
        Room room = new Room("Room A", 30, RoomType.LECTURE, "Building 1");

        when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));
        when(reservationRepository.existsByRoomIdAndTypeAndStartTimeLessThanAndEndTimeGreaterThan(any(), any(), any(), any()))
                .thenReturn(false);
        Reservation saved = new Reservation(room, start, end, "Alice", ReservationType.BOOKING, "lecture");
        when(reservationRepository.save(any())).thenReturn(saved);

        Reservation result = reservationService.createReservation(roomId, start, end, "Alice", "lecture");

        org.assertj.core.api.Assertions.assertThat(result.getBookerName()).isEqualTo("Alice");
    }
}