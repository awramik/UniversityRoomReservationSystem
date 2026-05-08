package com.university.room_reservation.service;

import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.Room;
import com.university.room_reservation.model.RoomType;
import java.util.List;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private ReservationService reservationService;

    @Test
    void shouldThrowExceptionWhenTryingToBookNonExistentRoom() {
        Long nonExistentRoomId = 999L;
        LocalDateTime start = LocalDateTime.of(2026, 5, 10, 10, 0);
        LocalDateTime end = LocalDateTime.of(2026, 5, 10, 12, 0);
        String bookerName = "Jan Kowalski";

        Mockito.when(roomRepository.findById(nonExistentRoomId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.createReservation(nonExistentRoomId, start, end, bookerName))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Room does not exist");
    }
    @Test
    void shouldThrowExceptionWhenReservationOverlaps() {
        Long roomId = 1L;
        LocalDateTime start = LocalDateTime.of(2026, 5, 10, 10, 0);
        LocalDateTime end = LocalDateTime.of(2026, 5, 10, 12, 0);
        String bookerName = "Anna Nowak";

        // Tworzymy salę, żeby mock mógł ją zwrócić
        Room room = new Room("Sala 101", 30, RoomType.LECTURE);
        room.setId(roomId);

        // Uczymy mocka 1: "Jak ktoś pyta o salę o ID 1, to ona istnieje"
        Mockito.when(roomRepository.findById(roomId)).thenReturn(Optional.of(room));

        // Tworzymy istniejącą już rezerwację, która powoduje konflikt
        Reservation existingReservation = new Reservation(room, start, end, "Jan Kowalski");

        // Uczymy mocka 2: "Jeśli ktoś sprawdza, czy są rezerwacje w tym czasie, zwróć listę z istniejącą rezerwacją"
        Mockito.when(reservationRepository.findByRoomIdAndStartTimeLessThanAndEndTimeGreaterThan(roomId, end, start))
                .thenReturn(List.of(existingReservation));

        // Oczekujemy, że system rzuci wyjątek, bo sala jest już zajęta
        assertThatThrownBy(() -> reservationService.createReservation(roomId, start, end, bookerName))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Room is already occupied!");
    }
}