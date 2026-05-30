package com.university.room_reservation.controller;

import com.university.room_reservation.dto.ErrorResponse;
import com.university.room_reservation.dto.RoomRequest;
import com.university.room_reservation.dto.RoomResponse;
import com.university.room_reservation.dto.UpdateRoomRequest;
import com.university.room_reservation.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/rooms")
@Tag(name = "Rooms")
@SecurityRequirement(name = "bearerAuth")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    @Operation(summary = "List all rooms",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Room list returned"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<RoomResponse> listRooms() {
        return roomService.listRooms().stream().map(RoomResponse::from).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a room by ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Room found"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public RoomResponse getRoom(@PathVariable Long id) {
        return RoomResponse.from(roomService.getRoom(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add a new room (admin only)",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Room created"),
                    @ApiResponse(responseCode = "400", description = "Validation failed",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Admin role required",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public RoomResponse addRoom(@Valid @RequestBody RoomRequest request) {
        return RoomResponse.from(roomService.addRoom(request));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a room's mutable fields (admin only)",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Room updated"),
                    @ApiResponse(responseCode = "400", description = "Validation failed",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Admin role required",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public RoomResponse updateRoom(@PathVariable Long id, @Valid @RequestBody UpdateRoomRequest request) {
        return RoomResponse.from(roomService.updateRoom(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove a room by ID (admin only)",
            responses = {
                    @ApiResponse(responseCode = "204", description = "Room deleted"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Admin role required",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public void removeRoom(@PathVariable Long id) {
        roomService.removeRoom(id);
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "Check if a room is available for given dates",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Room is available"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "501", description = "Not yet implemented",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public void checkAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        roomService.getRoom(id);
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Availability check not yet implemented");
    }
}


@RestController
@RequestMapping("/rooms")
@Tag(name = "Rooms")
@SecurityRequirement(name = "bearerAuth")
public class RoomController {

    private final RoomRepository roomRepository;

    public RoomController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @GetMapping
    @Operation(summary = "List all rooms",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Room list returned"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<RoomResponse> listRooms() {
        return roomRepository.findAll().stream().map(RoomResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Add a new room (admin only)",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Room created"),
                    @ApiResponse(responseCode = "400", description = "Validation failed",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Admin role required",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public RoomResponse addRoom(@Valid @RequestBody RoomRequest request) {
        Room room = new Room(request.name(), request.capacity(), request.roomType(), request.buildingName());
        return RoomResponse.from(roomRepository.save(room));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove a room by ID (admin only)",
            responses = {
                    @ApiResponse(responseCode = "204", description = "Room deleted"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Admin role required",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public void removeRoom(@PathVariable Long id) {
        if (!roomRepository.existsById(id)) {
            throw new RoomNotFoundException(id);
        }
        roomRepository.deleteById(id);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a room's mutable fields (admin only)",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Room updated"),
                    @ApiResponse(responseCode = "400", description = "Validation failed",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Admin role required",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public RoomResponse updateRoom(@PathVariable Long id, @Valid @RequestBody UpdateRoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RoomNotFoundException(id));
        if (request.name() != null) room.setName(request.name());
        if (request.buildingName() != null) room.setBuildingName(request.buildingName());
        if (request.capacity() != null) room.setCapacity(request.capacity());
        if (request.description() != null) room.setDescription(request.description());
        return RoomResponse.from(roomRepository.save(room));
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "Check if a room is available for given dates",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Room is available"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "501", description = "Not yet implemented",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public void checkAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (!roomRepository.existsById(id)) {
            throw new RoomNotFoundException(id);
        }
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Availability check not yet implemented");
    }
}
