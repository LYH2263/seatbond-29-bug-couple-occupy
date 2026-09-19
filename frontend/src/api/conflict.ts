export type HoldConflict = {
  conflict_id: number;
  showtime_id: number;
  party_size: number;
  kind: string; // no_contiguous | half_pair | overlap
  reason: string;
};

export const KIND_LABELS: Record<string, string> = {
  half_pair: "半对冲突",
  no_contiguous: "连续空座不足",
  overlap: "持座重叠",
};

export function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind ?? "—";
}
