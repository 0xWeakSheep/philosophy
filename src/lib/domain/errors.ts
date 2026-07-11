export type DomainErrorCode =
  | "NOT_FOUND"
  | "INVALID_STAGE"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "PERSISTENCE_ERROR";

export class DomainError extends Error {
  public constructor(
    message: string,
    public readonly code: DomainErrorCode,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
