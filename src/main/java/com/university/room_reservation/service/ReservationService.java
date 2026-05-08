package com.university.room_reservation.service;

import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;

    public ReservationService(ReservationRepository reservationRepository, RoomRepository roomRepository) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
    }

    public Reservation createReservation(Long roomId, LocalDateTime start, LocalDateTime end, String bookerName) {
        throw new UnsupportedOperationException("Implement createReservation!");
    }

    public boolean isRoomAvailable(Long roomId, LocalDateTime start, LocalDateTime end) {
        throw new UnsupportedOperationException("Implement isRoomAvailable!");
    }

    public List<Reservation> getAllReservations() {
        throw new UnsupportedOperationException("Implement getAllReservations!");
    }
}
