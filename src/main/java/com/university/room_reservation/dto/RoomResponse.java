package com.university.room_reservation.dto;

import com.university.room_reservation.model.Room;

public record RoomResponse(
        Long id,
        String name,
        String buildingName,
        int capacity,
        String roomType
) {
    public static RoomResponse from(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getName(),
                room.getBuildingName(),
                room.getCapacity(),
                room.getRoomType().name()
        );
    }
}
