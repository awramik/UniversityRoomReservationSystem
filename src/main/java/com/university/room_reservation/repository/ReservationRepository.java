package com.university.room_reservation.repository;

import com.university.room_reservation.model.Reservation;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.model.ReservationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID>, JpaSpecificationExecutor<Reservation> {

    boolean existsByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
            UUID roomId, ReservationType type, ReservationStatus status, LocalDateTime end, LocalDateTime start);

    Optional<Reservation> findByIdAndType(UUID id, ReservationType type);

    List<Reservation> findAllByType(ReservationType type);

    List<Reservation> findAllByTypeAndBookerName(ReservationType type, String bookerName);

    List<Reservation> findAllByRoomIdAndTypeAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
            UUID roomId, ReservationType type, ReservationStatus status, LocalDateTime end, LocalDateTime start);

    List<Reservation> findAllByRoomIdAndStartTimeLessThanAndEndTimeGreaterThan(
            UUID roomId, LocalDateTime end, LocalDateTime start);

    @Modifying
    @Query("UPDATE Reservation r SET r.status = 'PAST' WHERE r.status = 'ACTIVE' AND r.endTime < :now")
    void markAllExpiredAsPast(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Reservation r SET r.status = 'CANCELLED', r.room = null WHERE r.room.id = :roomId")
    void cancelAndDetachByRoomId(@Param("roomId") UUID roomId);

    long countByBookerNameAndTypeAndStatusAndStartTimeGreaterThanEqualAndStartTimeLessThan(
            String bookerName, ReservationType type, ReservationStatus status, LocalDateTime weekStart, LocalDateTime weekEnd);
}

