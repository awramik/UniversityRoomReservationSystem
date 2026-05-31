package com.university.room_reservation.service;

import com.university.room_reservation.dto.RoomRequest;
import com.university.room_reservation.dto.UpdateRoomRequest;
import com.university.room_reservation.dto.AvailabilityResponse;
import com.university.room_reservation.model.Room;
import com.university.room_reservation.model.RoomType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface RoomService {

    Room addRoom(RoomRequest request);

    void removeRoom(UUID id);

    Room updateRoom(UUID id, UpdateRoomRequest request);

    List<Room> listRooms(RoomType type, String building, Integer minCapacity, Integer maxCapacity);

    Room getRoom(UUID id);

    AvailabilityResponse checkAvailability(UUID roomId, LocalDateTime start, LocalDateTime end);
}
