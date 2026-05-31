package com.university.room_reservation.service;

import com.university.room_reservation.model.Reservation;

import java.time.LocalDateTime;
import java.util.UUID;

public interface ReservationService {

    Reservation createReservation(UUID roomId, LocalDateTime start, LocalDateTime end, String bookerName, String purpose);

    Reservation createAdminBlock(UUID roomId, LocalDateTime start, LocalDateTime end, String adminUsername, String purpose);

    void deleteAdminBlock(UUID roomId, UUID blockId);
}
