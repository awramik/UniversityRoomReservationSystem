package com.university.room_reservation.controller;

import com.university.room_reservation.dto.AdminBlockRequest;
import com.university.room_reservation.dto.AdminBlockResponse;
import com.university.room_reservation.dto.ErrorResponse;
import com.university.room_reservation.dto.ReservationDetailResponse;
import com.university.room_reservation.dto.ReservationRequest;
import com.university.room_reservation.dto.ReservationResponse;
import com.university.room_reservation.model.Role;
import com.university.room_reservation.model.ReservationStatus;
import com.university.room_reservation.service.ReservationService;
import com.university.room_reservation.service.UserService;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/reservations")
@Tag(name = "Reservations")
@SecurityRequirement(name = "bearerAuth")
public class ReservationController {

    private final ReservationService reservationService;
    private final UserService userService;

    public ReservationController(ReservationService reservationService, UserService userService) {
        this.reservationService = reservationService;
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List all reservations, with optional filters by date range, room and status (booker name visible to admins only)",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Reservation list returned"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<ReservationResponse> listReservations(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) UUID roomId,
            @RequestParam(required = false) ReservationStatus status) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return reservationService.listReservations(startDate, endDate, roomId, status).stream()
                .map(r -> isAdmin ? ReservationResponse.from(r) : ReservationResponse.fromPublic(r))
                .toList();
    }

    @GetMapping("/my")
    @Operation(summary = "List current user's reservations",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Reservation list returned"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public List<ReservationResponse> listMyReservations(Authentication authentication) {
        return reservationService.listMyReservations(authentication.getName()).stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get reservation details (full room info; booker name visible to admins only)",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Reservation found"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Reservation not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public ReservationDetailResponse getReservation(@PathVariable UUID id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        var reservation = reservationService.getReservation(id);
        if (isAdmin) {
            var booker = userService.getByUsername(reservation.getBookerName());
            return ReservationDetailResponse.from(reservation, booker);
        }
        return ReservationDetailResponse.fromPublic(reservation);
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
        Role role = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .map(Role::valueOf)
                .findFirst()
                .orElse(Role.STUDENT);
        return ReservationResponse.from(
                reservationService.createReservation(
                        request.roomId(),
                        request.startTime(),
                        request.endTime(),
                        authentication.getName(),
                        role,
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

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Cancel a reservation",
            responses = {
                    @ApiResponse(responseCode = "204", description = "Reservation cancelled"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Not your reservation",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Reservation not found",
                            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
            })
    public void cancelReservation(@PathVariable UUID id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        reservationService.cancelReservation(id, authentication.getName(), isAdmin);
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
