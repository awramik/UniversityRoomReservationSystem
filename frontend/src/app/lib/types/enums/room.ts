import type { RoomRequest } from "../dto/room";

export type RoomType = RoomRequest["roomType"];

export const ROOM_TYPES: Record<RoomType, string> = {
  LECTURE: "Wykładowa",
  LABORATORY: "Laboratoryjna",
  COMPUTER: "Komputerowa",
  CONFERENCE: "Konferencyjna",
};
