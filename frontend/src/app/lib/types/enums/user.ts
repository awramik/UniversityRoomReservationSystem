import type { UserProfileResponse } from "../dto/user";

export type UserRole = NonNullable<UserProfileResponse["role"]>;

export const USER_ROLES: Record<UserRole, string> = {
  ADMIN: "Administrator",
  STUDENT: "Student",
  LECTURER: "Prowadzący",
};
