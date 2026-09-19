/** Shared labels for conflict-log kinds, shown on both the lock page (failure
 * message) and the conflicts page (kind badge) so one request reads the same. */
export const CONFLICT_KIND_LABELS: Record<string, string> = {
  half_pair: "半对冲突",
  no_contiguous: "连续空座不足",
  overlap: "持座重叠",
};
