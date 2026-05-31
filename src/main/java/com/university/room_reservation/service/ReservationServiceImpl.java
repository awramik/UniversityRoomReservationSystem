package com.university.room_reservation.service;

import com.university.room_reservation.config.BookingLimitsProperties;
import com.university.room_reservation.exception.*;
import com.university.room_reservation.model.*;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ReservationServiceImpl implements ReservationService {

    private static final Set<RoomType> LECTURER_ONLY_TYPES = Set.of(RoomType.LECTURE, RoomType.LABORATORY);

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final BookingLimitsProperties limits;

    public ReservationServiceImpl(ReservationRepository reservationRepository,
                                  RoomRepository roomRepository,
                                  BookingLimitsProperties limits) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.limits = limits;
    }

    @Override
    @Transactional
    public Reservation createReservation(UUID roomId, LocalDateTime start, LocalDateTime end, String bookerName, Role role, String purpose) {
        if (!start.isAfter(LocalDateTime.now())) {
            throw new InvalidTimeRangeException("Reservation start time must be in the future");
        }
        if (!end.isAfter(start)) {
            throw new InvalidTimeRangeException("End time must be after start time");
        }

        var room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException(roomId));

        if (role == Role.STUDENT && LECTURER_ONLY_TYPES.contains(room.getRoomType())) {
            throw new RoomBookingNotAllowedException(role.name(), room.getRoomType().name());
        }

        if (role != Role.ADMIN) {
            BookingLimitsProperties.RoleLimits roleLimits = role == Role.LECTURER ? limits.getLecturer() : limits.getStudent();

            long durationHours = Duration.between(start, end).toHours();
            if (durationHours > roleLimits.getMaxDurationHours()) {
                throw new BookingLimitExceededException(
                        "Reservation exceeds maximum allowed duration of " + roleLimits.getMaxDurationHours() + " hours");
            }

            LocalDateTime weekStart = start.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toLocalDate().atStartOfDay();
            LocalDateTime weekEnd = weekStart.plusWeeks(1);
            long weeklyCount = reservationRepository
                    .countByBookerNameAndTypeAndStatusAndStartTimeGreaterThanEqualAndStartTimeLessThan(
                            bookerName, ReservationType.BOOKING, ReservationStatus.ACTIVE, weekStart, weekEnd);
            if (weeklyCount >= roleLimits.getMaxPerWeek()) {
                throw new BookingLimitExceededException(
                        "Weekly reservation limit of " + roleLimits.getMaxPerWeek() + " reached");
            }
        }

        if (reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                roomId, ReservationType.BOOKING, ReservationStatus.ACTIVE, end, start)) {
            throw new ReservationConflictException();
        }
        if (reservationRepository.existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                roomId, ReservationType.ADMIN_BLOCK, ReservationStatus.ACTIVE, end, start)) {
            throw new AdminBlockConflictException();
        }

        return reservationRepository.save(new Reservation(room, start, end, bookerName, ReservationType.BOOKING, purpose));
    }

    @Override
    @Transactional
    public Reservation createAdminBlock(UUID roomId, LocalDateTime start, LocalDateTime end, String adminUsername, String purpose) {
        if (!end.isAfter(start)) {
            throw new InvalidTimeRangeException("End time must be after start time");
        }
        var room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RoomNotFoundException(roomId));

        var block = reservationRepository.save(new Reservation(room, start, end, adminUsername, ReservationType.ADMIN_BLOCK, purpose));

        var affected = reservationRepository.findAllByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                roomId, ReservationType.BOOKING, ReservationStatus.ACTIVE, end, start);
        affected.forEach(r -> r.setStatus(ReservationStatus.CANCELLED));
        reservationRepository.saveAll(affected);

        return block;
    }

    @Override
    @Transactional
    public void deleteAdminBlock(UUID blockId) {
        Reservation block = reservationRepository.findByIdAndType(blockId, ReservationType.ADMIN_BLOCK)
                .orElseThrow(() -> new ReservationNotFoundException(blockId));
        reservationRepository.delete(block);
    }

    @Override
    @Transactional
    public void cancelReservation(UUID reservationId, String callerUsername, boolean isAdmin) {
        Reservation reservation = reservationRepository.findByIdAndType(reservationId, ReservationType.BOOKING)
                .orElseThrow(() -> new ReservationNotFoundException(reservationId));

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new ReservationNotFoundException(reservationId);
        }

        if (!isAdmin && !reservation.getBookerName().equals(callerUsername)) {
            throw new org.springframework.security.access.AccessDeniedException("You can only cancel your own reservations");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);
    }

    @Override
    @Transactional
    public List<Reservation> listReservations(LocalDate startDate, LocalDate endDate, UUID roomId, ReservationStatus status, String username) {
        reservationRepository.markAllExpiredAsPast(LocalDateTime.now());
        Specification<Reservation> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("type"), ReservationType.BOOKING));
            if (startDate != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), startDate.atStartOfDay()));
            if (endDate != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("endTime"), endDate.plusDays(1).atStartOfDay()));
            if (roomId != null)
                predicates.add(cb.equal(root.get("room").get("id"), roomId));
            if (status != null)
                predicates.add(cb.equal(root.get("status"), status));
            if (username != null)
                predicates.add(cb.equal(root.get("bookerName"), username));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return reservationRepository.findAll(spec);
    }

    @Override
    @Transactional
    public List<Reservation> listMyReservations(String username) {
        reservationRepository.markExpiredAsPastForUser(LocalDateTime.now(), username);
        return reservationRepository.findAllByTypeAndBookerName(ReservationType.BOOKING, username);
    }

    @Override
    @Transactional
    public Reservation getReservation(UUID reservationId) {
        Reservation reservation = reservationRepository.findByIdAndType(reservationId, ReservationType.BOOKING)
                .orElseThrow(() -> new ReservationNotFoundException(reservationId));

        if (reservation.getStatus() == ReservationStatus.ACTIVE
                && reservation.getEndTime().isBefore(LocalDateTime.now())) {
            reservation.setStatus(ReservationStatus.PAST);
            reservationRepository.save(reservation);
        }

        return reservation;
    }
}

