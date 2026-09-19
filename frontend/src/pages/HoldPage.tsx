import { useEffect, useState } from "react";
import { ApiError, api } from "../api/client";
import { kindLabel } from "../api/conflict";

type Show = { id: number; film_title: string; hall_name?: string };
type Hold = {
  id: number;
  order_code: string;
  row: number;
  start_col: number;
  end_col: number;
  party_size: number;
  couple_cols: number[];
};
type FailedHold = {
  conflictId: number;
  showtimeId: number;
  partySize: number;
  kind: string;
  reason: string;
};

function coupleLabel(h: Hold): string {
  if (!h.couple_cols?.length) return "";
  return ` · 💑 情侣对 ${h.couple_cols.map((c) => `C${c}-${c + 1}`).join("、")}`;
}

export default function HoldPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [sid, setSid] = useState<number | "">("");
  const [party, setParty] = useState(3);
  const [prefRow, setPrefRow] = useState("");
  const [msg, setMsg] = useState("");
  const [failed, setFailed] = useState<FailedHold | null>(null);
  const [last, setLast] = useState<Hold | null>(null);

  useEffect(() => {
    api<Show[]>("/showtimes").then((s) => {
      setShows(s);
      if (s[0]) setSid(s[0].id);
    });
  }, []);

  async function submit() {
    setMsg("");
    setFailed(null);
    try {
      const body: Record<string, unknown> = { showtime_id: sid, party_size: party };
      if (prefRow) body.preferred_row = Number(prefRow);
      const hold = await api<Hold>("/holds", { method: "POST", body: JSON.stringify(body) });
      setLast(hold);
      setMsg(`已锁座 ${hold.order_code}：第${hold.row}排 ${hold.start_col}-${hold.end_col}${coupleLabel(hold)}`);
    } catch (e) {
      if (e instanceof ApiError && e.conflict) {
        const c = e.conflict;
        setFailed({
          conflictId: c.conflict_id,
          showtimeId: c.showtime_id,
          partySize: c.party_size,
          kind: c.kind,
          reason: c.reason,
        });
      } else {
        setFailed({
          conflictId: 0,
          showtimeId: Number(sid),
          partySize: party,
          kind: "",
          reason: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  return (
    <>
      <h2>锁座</h2>
      <div className="toolbar">
        <select value={sid} onChange={(e) => setSid(Number(e.target.value))}>
          {shows.map((s) => (
            <option key={s.id} value={s.id}>
              {s.film_title} · {s.hall_name}
            </option>
          ))}
        </select>
        <label>
          人数{" "}
          <input
            type="number"
            min={1}
            max={12}
            value={party}
            onChange={(e) => setParty(Number(e.target.value))}
            style={{ width: 72 }}
          />
        </label>
        <label>
          优先排{" "}
          <input
            value={prefRow}
            onChange={(e) => setPrefRow(e.target.value)}
            placeholder="可选"
            style={{ width: 72 }}
          />
        </label>
        <button onClick={submit}>查找并锁连座</button>
      </div>
      {msg && <div className="ok">{msg}</div>}
      {failed && (
        <div className="err hold-fail">
          <span className={`kind-badge kind-${failed.kind || "unknown"}`}>
            {failed.kind ? kindLabel(failed.kind) : "锁座失败"}
          </span>
          <span>{failed.reason}</span>
          {failed.conflictId > 0 && (
            <span className="mono hold-fail-ref">
              场次 {failed.showtimeId} · {failed.partySize} 人 · 冲突记录 #{failed.conflictId}
              （与「冲突」页同一笔、同一原因）
            </span>
          )}
        </div>
      )}
      {last && (
        <p className="mono">
          订单 {last.order_code} · {last.party_size} 人 · R{last.row} C{last.start_col}-{last.end_col}
          {coupleLabel(last)}
        </p>
      )}
    </>
  );
}
