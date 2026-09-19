export class ApiError extends Error {
  /** Machine-distinguishable failure kind (half_pair | no_contiguous | overlap). */
  kind?: string;
  /** Id of the conflict-log entry recorded for this failed request. */
  conflictId?: number;

  constructor(message: string, kind?: string, conflictId?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.conflictId = conflictId;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    let kind: string | undefined;
    let conflictId: number | undefined;
    try {
      // FastAPI puts the message under `detail`: either a plain string or the
      // hold-failure payload { kind, reason, conflict_id }.
      const detail = JSON.parse(text)?.detail;
      if (typeof detail === "string") {
        message = detail;
      } else if (detail && typeof detail === "object") {
        if (typeof detail.reason === "string") message = detail.reason;
        if (typeof detail.kind === "string") kind = detail.kind;
        if (typeof detail.conflict_id === "number") conflictId = detail.conflict_id;
      }
    } catch {
      // non-JSON error body — keep the raw text
    }
    throw new ApiError(message, kind, conflictId);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
