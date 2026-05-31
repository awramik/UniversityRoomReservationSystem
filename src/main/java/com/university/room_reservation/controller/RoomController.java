package com.university.room_reservation.controller;

import com.university.room_reservation.dto.AdminBlockRequest;
import com.university.room_reservation.dto.AdminBlockResponse;
import com.university.room_reservation.dto.ErrorResponse;
import com.university.room_reservation.dto.RoomRequest;
import com.university.room_reservation.dto.RoomResponse;
import com.university.room_reservation.dto.UpdateRoomRequest;
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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
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
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        roomService.getRoom(id);
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "Availability check not yet implemented");
    }

    @PostMapping("/{id}/blocks")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create an admin unavailability block for a room (admin only)",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Block created"),
                    @ApiResponse(responseCode = "400", description = "Invalid time range",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Admin role required",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public AdminBlockResponse createAdminBlock(
            @PathVariable UUID id,
            @Valid @RequestBody AdminBlockRequest request,
            Authentication authentication) {
        return AdminBlockResponse.from(
                reservationService.createAdminBlock(id, request.startTime(), request.endTime(), authentication.getName(), request.purpose())
        );
    }

    @DeleteMapping("/{id}/blocks/{blockId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete an admin unavailability block (admin only)",
            responses = {
                    @ApiResponse(responseCode = "204", description = "Block deleted"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Admin role required",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Block not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public void deleteAdminBlock(@PathVariable UUID id, @PathVariable UUID blockId) {
        reservationService.deleteAdminBlock(id, blockId);
    }
}
