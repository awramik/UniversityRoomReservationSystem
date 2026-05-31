package com.university.room_reservation.controller;

import com.university.room_reservation.dto.AdminBlockRequest;
import com.university.room_reservation.dto.AdminBlockResponse;
import com.university.room_reservation.dto.ErrorResponse;
import com.university.room_reservation.dto.ReservationRequest;
import com.university.room_reservation.dto.ReservationResponse;
import com.university.room_reservation.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/reservations")
@Tag(name = "Reservations")
@SecurityRequirement(name = "bearerAuth")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a reservation",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Reservation created"),
                    @ApiResponse(responseCode = "400", description = "Validation failed",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "409", description = "Time slot already booked",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "422", description = "Room blocked by admin for this time slot",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ReservationResponse createReservation(
            @Valid @RequestBody ReservationRequest request,
            Authentication authentication) {
        return ReservationResponse.from(
                reservationService.createReservation(
                        request.roomId(),
                        request.startTime(),
                        request.endTime(),
                        authentication.getName(),
                        request.purpose()
                )
        );
    }

    @PostMapping("/blocks")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create an admin unavailability block (admin only)",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Block created"),
                    @ApiResponse(responseCode = "400", description = "Invalid time range or validation failed",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Admin role required",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Room not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public AdminBlockResponse createAdminBlock(
            @Valid @RequestBody AdminBlockRequest request,
            Authentication authentication) {
        return AdminBlockResponse.from(
                reservationService.createAdminBlock(
                        request.roomId(),
                        request.startTime(),
                        request.endTime(),
                        authentication.getName(),
                        request.purpose()
                )
        );
    }

    @DeleteMapping("/blocks/{blockId}")
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
    public void deleteAdminBlock(@PathVariable UUID blockId) {
        reservationService.deleteAdminBlock(blockId);
    }
}
