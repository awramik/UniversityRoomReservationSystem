package com.university.room_reservation.service;

import com.university.room_reservation.dto.AvailabilityResponse;
import com.university.room_reservation.dto.ReservationDetailResponse;
import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.model.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ReservationService {

    Reservation createReservation(UUID roomId, LocalDateTime start, LocalDateTime end, String bookerName, Role role, String purpose);

    Reservation createAdminBlock(UUID roomId, LocalDateTime start, LocalDateTime end, String adminUsername, String purpose);

    void deleteAdminBlock(UUID blockId);

    void cancelReservation(UUID reservationId, String callerUsername, boolean isAdmin);

    List<Reservation> listReservations(LocalDate startDate, LocalDate endDate, UUID roomId, ReservationStatus status, String username);

    List<Reservation> listMyReservations(String username);

    ReservationDetailResponse getReservationDetail(UUID reservationId, String callerUsername, boolean isAdmin);

    AvailabilityResponse checkAvailability(UUID roomId, LocalDateTime start, LocalDateTime end);
}
