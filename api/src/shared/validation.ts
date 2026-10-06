import { randomUUID } from "node:crypto";

export function newCorrelationId(): string {
  return randomUUID();
}

const MAX_TEXT_LENGTH = 4000;

/** Validate and sanitize free-form text input from the client. */
export function validateText(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`${fieldName} must not be empty.`);
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new ValidationError(`${fieldName} exceeds the maximum allowed length.`);
  }
  return trimmed;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Validates that a string looks like a plausible http(s) URL/hostname and blocks obviously unsafe targets. */
export function validateWebsite(value: unknown, fieldName: string): string {
  const raw = validateText(value, fieldName);
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new ValidationError(`${fieldName} is not a valid website address.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ValidationError(`${fieldName} must use http or https.`);
  }

  const host = url.hostname.toLowerCase();
  const isPrivate =
    host === "localhost" ||
    host === "0.0.0.0" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal");

  if (isPrivate) {
    throw new ValidationError(`${fieldName} must be a public website address.`);
  }

  return url.toString();
}
