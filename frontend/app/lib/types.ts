// Auth DTOs
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

// User DTOs
export interface UserProfileResponse {
  id: string;
  username: string;
  name: string;
  surname: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'LECTURER';
}

export interface UpdateUserProfileRequest {
  email?: string;
  name?: string;
  surname?: string;
}

// Room DTOs
export interface RoomRequest {
  name: string;
  buildingName: string;
  capacity: number;
  roomType: 'LECTURE' | 'LABORATORY' | 'COMPUTER' | 'CONFERENCE';
  description?: string;
}

export interface RoomResponse {
  id: string;
  name: string;
  buildingName: string;
  capacity: number;
  roomType: 'LECTURE' | 'LABORATORY' | 'COMPUTER' | 'CONFERENCE';
  description: string | null;
}

export interface UpdateRoomRequest {
  name?: string;
  buildingName?: string;
  capacity?: number;
  description?: string;
}

// Reservation DTOs
export interface ReservationRequest {
  roomId: string;
  startTime: string; // ISO 8601 LocalDateTime
  endTime: string; // ISO 8601 LocalDateTime
  purpose?: string;
}

export interface ReservationResponse {
  id: string;
  roomId: string;
  roomName: string;
  startTime: string; // ISO 8601 LocalDateTime
  endTime: string; // ISO 8601 LocalDateTime
  bookerName: string | null;
  purpose: string | null;
  status: 'ACTIVE' | 'PAST' | 'CANCELLED';
}

export interface ReservationDetailResponse {
  id: string;
  room: RoomResponse;
  startTime: string; // ISO 8601 LocalDateTime
  endTime: string; // ISO 8601 LocalDateTime
  booker: UserProfileResponse | null;
  purpose: string | null;
  status: 'ACTIVE' | 'PAST' | 'CANCELLED';
}

// Admin DTOs
export interface AdminBlockRequest {
  roomId: string;
  startTime: string; // ISO 8601 LocalDateTime
  endTime: string; // ISO 8601 LocalDateTime
  purpose?: string;
}

export interface AdminBlockResponse {
  id: string;
  roomId: string;
  startTime: string; // ISO 8601 LocalDateTime
  endTime: string; // ISO 8601 LocalDateTime
  purpose: string | null;
}

// Availability DTOs
export interface ConflictInterval {
  startTime: string;
  endTime: string;
}

export interface AvailabilityResponse {
  available: boolean;
  conflicts: ConflictInterval[] | null;
}

// Error response
export interface ErrorResponse {
  status: number;
  error: string;
}

// API Error wrapper
export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: ErrorResponse
  ) {
    super(message);
    this.name = 'APIError';
  }
}
