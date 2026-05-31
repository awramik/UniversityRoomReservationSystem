package com.university.room_reservation.controller;

import com.university.room_reservation.dto.AvailabilityResponse;
import com.university.room_reservation.dto.ErrorResponse;
import com.university.room_reservation.dto.RoomRequest;
import com.university.room_reservation.dto.RoomResponse;
import com.university.room_reservation.dto.UpdateRoomRequest;
import com.university.room_reservation.model.RoomType;
import com.university.room_reservation.service.ReservationService;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/rooms")
@Tag(name = "Rooms")
@SecurityRequirement(name = "bearerAuth")
public class RoomController {

    private final RoomService roomService;
    private final ReservationService reservationService;

    public RoomController(RoomService roomService, ReservationService reservationService) {
        this.roomService = roomService;
        this.reservationService = reservationService;
    }

    @GetMapping
    @Operation(summary = "List all rooms, with optional filters by type, building and capacity range",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Room list returned"),
                    @ApiResponse(responseCode = "400", description = "Invalid filter value",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<RoomResponse> listRooms(
            @RequestParam(required = false) RoomType type,
            @RequestParam(required = false) String building,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Integer maxCapacity) {
        return roomService.listRooms(type, building, minCapacity, maxCapacity).stream().map(RoomResponse::from).toList();
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
    public RoomResponse getRoom(@PathVariable UUID id) {
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
    public RoomResponse updateRoom(@PathVariable UUID id, @Valid @RequestBody UpdateRoomRequest request) {
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
    public void removeRoom(@PathVariable UUID id) {
        roomService.removeRoom(id);
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "Check if a room is available for a given time window",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Availability status returned"),
                    @ApiResponse(responseCode = "400", description = "Invalid time range",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public AvailabilityResponse checkAvailability(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return reservationService.checkAvailability(id, startTime, endTime);
    }
}
