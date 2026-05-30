package com.university.room_reservation.controller;

import com.university.room_reservation.dto.RoomRequest;
import com.university.room_reservation.dto.RoomResponse;
import com.university.room_reservation.exception.RoomNotFoundException;
import com.university.room_reservation.model.Room;
import com.university.room_reservation.repository.RoomRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/rooms")
@Tag(name = "Rooms")
@SecurityRequirement(name = "bearerAuth")
public class RoomController {

    private final RoomRepository roomRepository;

    public RoomController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add a new room (admin only)")
    public RoomResponse addRoom(@Valid @RequestBody RoomRequest request) {
        Room room = new Room(request.name(), request.capacity(), request.roomType());
        return RoomResponse.from(roomRepository.save(room));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove a room by ID (admin only)")
    public void removeRoom(@PathVariable Long id) {
        if (!roomRepository.existsById(id)) {
            throw new RoomNotFoundException(id);
        }
        roomRepository.deleteById(id);
    }
}
