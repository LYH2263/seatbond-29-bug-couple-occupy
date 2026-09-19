import type { HoldConflict } from "./conflict";

export class ApiError extends Error {
  status: number;
  conflict: HoldConflict | null;

  constructor(status: number, message: string, conflict: HoldConflict | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.conflict = conflict;
  }
}

function asHoldConflict(body: unknown): HoldConflict | null {
  if (
    body &&
    typeof body === "object" &&
    "kind" in body &&
    "reason" in body &&
    "conflict_id" in body
  ) {
    const b = body as Record<string, unknown>;
    return {
      conflict_id: Number(b.conflict_id),
      showtime_id: Number(b.showtime_id),
      party_size: Number(b.party_size),
      kind: String(b.kind),
      reason: String(b.reason),
    };
  }
  return null;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let text = "";
    let body: unknown = null;
    try {
      text = await res.text();
      body = text ? JSON.parse(text) : null;
    } catch {
      // non-JSON error page — fall through with the raw text
    }
    // FastAPI errors are {"detail": ...}; a failed hold carries the conflict row there
    const detail =
      body && typeof body === "object" && "detail" in body
        ? (body as Record<string, unknown>).detail
        : body;
    const conflict = asHoldConflict(detail);
    const message =
      (conflict && conflict.reason) ||
      (typeof detail === "string" && detail) ||
      text ||
      res.statusText;
    throw new ApiError(res.status, message, conflict);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
