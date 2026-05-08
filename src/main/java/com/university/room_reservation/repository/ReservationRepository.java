package com.university.room_reservation.repository;

import com.university.room_reservation.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByRoomIdAndStartTimeLessThanAndEndTimeGreaterThan(
            Long roomId, LocalDateTime endTime, LocalDateTime startTime);
}
