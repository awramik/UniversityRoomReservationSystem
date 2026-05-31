package com.university.room_reservation.service;

import com.university.room_reservation.dto.RoomRequest;
import com.university.room_reservation.dto.UpdateRoomRequest;
import com.university.room_reservation.exception.RoomNotFoundException;
import com.university.room_reservation.model.Room;
import com.university.room_reservation.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;

    public RoomServiceImpl(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
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
    public List<Room> listRooms() {
        return roomRepository.findAll();
    }

    @Override
    public Room getRoom(UUID id) {
        return roomRepository.findById(id).orElseThrow(() -> new RoomNotFoundException(id));
    }
}
