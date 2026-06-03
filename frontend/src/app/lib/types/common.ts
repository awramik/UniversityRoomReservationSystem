export type UUID = string;
export type LocalDateTime = string;
export type Nullable<T> = T | null;

export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: import("./dto/error").ErrorResponse,
  ) {
    super(message);
    this.name = "APIError";
  }
}
