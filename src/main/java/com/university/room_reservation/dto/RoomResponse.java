package com.university.room_reservation.dto;

import com.university.room_reservation.model.Room;
import com.university.room_reservation.model.RoomType;

import java.util.UUID;

public record RoomResponse(
        UUID id,
        String name,
        String buildingName,
        int capacity,
        RoomType roomType,
        String description
) {
    public static RoomResponse from(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getBuildingName(),
                room.getCapacity(),
                room.getRoomType(),
                room.getDescription()
        );
    }
}
