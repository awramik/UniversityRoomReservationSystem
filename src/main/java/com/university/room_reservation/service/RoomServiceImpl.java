package com.university.room_reservation.service;

import com.university.room_reservation.dto.AvailabilityResponse;
import com.university.room_reservation.dto.RoomRequest;
import com.university.room_reservation.dto.UpdateRoomRequest;
import com.university.room_reservation.exception.InvalidTimeRangeException;
import com.university.room_reservation.exception.RoomNotFoundException;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.model.Room;
import com.university.room_reservation.model.RoomType;
import com.university.room_reservation.repository.ReservationRepository;
import com.university.room_reservation.repository.RoomRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;

    public RoomServiceImpl(RoomRepository roomRepository, ReservationRepository reservationRepository) {
        this.roomRepository = roomRepository;
        this.reservationRepository = reservationRepository;
    }

    @Override
    public Room addRoom(RoomRequest request) {
        Room room = new Room(request.name(), request.capacity(), request.roomType(), request.buildingName());
        room.setDescription(request.description());
        return roomRepository.save(room);
    }

    @Override
    public void removeRoom(UUID id) {
        if (!roomRepository.existsById(id)) throw new RoomNotFoundException(id);
        roomRepository.deleteById(id);
    }

    @Override
    public Room updateRoom(UUID id, UpdateRoomRequest request) {
        Room room = roomRepository.findById(id).orElseThrow(() -> new RoomNotFoundException(id));
        if (request.name() != null) room.setName(request.name());
        if (request.buildingName() != null) room.setBuildingName(request.buildingName());
        if (request.capacity() != null) room.setCapacity(request.capacity());
        if (request.description() != null) room.setDescription(request.description());
        return roomRepository.save(room);
    }

    @Override
    public List<Room> listRooms(RoomType type, String building, Integer minCapacity, Integer maxCapacity) {
        Specification<Room> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (type != null) predicates.add(cb.equal(root.get("roomType"), type));
            if (building != null) predicates.add(cb.equal(root.get("buildingName"), building));
            if (minCapacity != null) predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
            if (maxCapacity != null) predicates.add(cb.lessThanOrEqualTo(root.get("capacity"), maxCapacity));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return roomRepository.findAll(spec);
    }

    @Override
    public Room getRoom(UUID id) {
        return roomRepository.findById(id).orElseThrow(() -> new RoomNotFoundException(id));
    }

    @Override
    public AvailabilityResponse checkAvailability(UUID roomId, LocalDateTime start, LocalDateTime end) {
        if (!end.isAfter(start)) throw new InvalidTimeRangeException("End time must be after start time");
        if (!roomRepository.existsById(roomId)) throw new RoomNotFoundException(roomId);

        var conflicts = reservationRepository
                .findAllByRoomIdAndStartTimeLessThanAndEndTimeGreaterThan(roomId, end, start)
                .stream()
                .filter(r -> r.getStatus() != ReservationStatus.CANCELLED)
                .map(r -> new AvailabilityResponse.ConflictInterval(r.getStartTime(), r.getEndTime()))
                .toList();

        return conflicts.isEmpty()
                ? new AvailabilityResponse(true, null)
                : new AvailabilityResponse(false, conflicts);
    }
}
