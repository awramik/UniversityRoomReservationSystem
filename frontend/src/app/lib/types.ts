import type { components } from "@/src/api/schema";

// helpers
export type UUID = string;
export type LocalDateTime = string;
export type Nullable<T> = T | null;

// Auth
export type LoginRequest = components["schemas"]["LoginRequest"];
export type LoginResponse = components["schemas"]["LoginResponse"];

// User
export type UserProfileResponse = components["schemas"]["UserProfileResponse"];
export type UpdateUserProfileRequest = components["schemas"]["UpdateUserProfileRequest"];

// Room
export type RoomRequest = components["schemas"]["RoomRequest"];
export type RoomResponse = components["schemas"]["RoomResponse"];
export type UpdateRoomRequest = components["schemas"]["UpdateRoomRequest"];

// Reservation
export type ReservationRequest = components["schemas"]["ReservationRequest"];
export type ReservationResponse = components["schemas"]["ReservationResponse"];
export type ReservationDetailResponse = components["schemas"]["ReservationDetailResponse"];

// Admin
export type AdminBlockRequest = components["schemas"]["AdminBlockRequest"];
export type AdminBlockResponse = components["schemas"]["AdminBlockResponse"];

// Availability
export type AvailabilityResponse = components["schemas"]["AvailabilityResponse"];
export type ConflictInterval = components["schemas"]["ConflictInterval"];

// Error
export type ErrorResponse = components["schemas"]["ErrorResponse"];


export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: ErrorResponse
  ) {
    super(message);
    this.name = "APIError";
  }
}

export type RoomType = components["schemas"]["RoomRequest"]["roomType"];
export const ROOM_TYPES: Record<RoomType, string> =
{
  LECTURE: 'Wykładowa',
  LABORATORY: 'Laboratoryjna',
  COMPUTER: 'Komputerowa',
  CONFERENCE: 'Konferencyjna',
};

export type ReservationStatus =
  Exclude<
    components["schemas"]["ReservationDetailResponse"]["status"],
    undefined | null
  >;
export const RESERVATION_STATUS:  Record<ReservationStatus, string> =
{
  ACTIVE: 'Aktywna',
  PAST: 'Przeszła',
  CANCELLED: 'Anulowana',
}; 