import { useState } from "react";
import { TASKS } from "../utils/constants";
import { tod, fmt, daysAgo } from "../utils/helpers";
import DB from "../utils/db";
import { smartFill } from "../utils/ai";

export default function MaintTab({ rows, setRows, getCtx }) {
  const [sel, setSel]     = useState(null);
  const [date, setDate]   = useState(tod());
  const [notes, setNotes] = useState("");
  const [filling, setFilling] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);

  const status = (t) => {
    const e = [...rows].filter(l => l.task === t.id).pop();
    if (!e) return { s: "never", d: null };
    const d = daysAgo(e.date);
    if (d <= t.every * .75) return { s: "ok", d };
    if (d <= t.every) return { s: "warn", d };
    return { s: "due", d };
  };

  const log = async () => {
    if (!sel) return;
    const up = [...rows, { date, task: sel, notes }].sort((a, b) => a.date.localeCompare(b.date));
    setRows(up); await DB.set("maint", up); setSel(null); setNotes(""); setAiSuggested(false);
  };

  const handleSmartFill = async () => {
    setFilling(true);
    const result = await smartFill("maint", getCtx());
    if (result) {
      if (result.task) setSel(result.task);
      if (result.notes) setNotes(result.notes);
      setAiSuggested(true);
    }
    setFilling(false);
  };

  return <>
    <div className="sec-title">Maintenance Tracker</div>
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div className="card-title">Task Status · Click to Log Completion</div>
        <button className="btn btn-ghost btn-sm" onClick={handleSmartFill} disabled={filling}>
          {filling ? "🤖 Thinking..." : "✨ Smart Fill"}
        </button>
      </div>
      {aiSuggested && (
        <div style={{ fontSize: ".7rem", color: "#06b6d4", marginBottom: 10, padding: "5px 10px", borderRadius: 6, background: "rgba(6,182,212,.08)", border: "1px solid rgba(6,182,212,.2)" }}>
          🤖 AI suggested task — review and confirm below
        </div>
      )}
      <div className="tgrid">
        {TASKS.map(t => {
          const { s, d } = status(t);
          const sc = { ok: "#34d399", warn: "#fbbf24", due: "#f43f5e", never: "#94a3b8" }[s];
          const st = s === "never" ? "Never logged" : s === "ok" ? `${d}d ago ✓` : s === "warn" ? `${d}d ago ⚠️` : `${d}d ago — OVERDUE`;
          return (
            <div key={t.id} className={`tcard ${s} ${sel === t.id ? "sel" : ""}`}
              onClick={() => { setSel(sel === t.id ? null : t.id); setAiSuggested(false); }}
              style={{ color: sc, outlineColor: sc }}>
              <div className="tic">{t.icon}</div>
              <div className="tlbl">{t.label}</div>
              <div className="tsts">{st}</div>
              <div className="tint">Every {t.every}d</div>
            </div>
          );
        })}
      </div>
      {sel && (
        <div style={{ padding: 14, borderRadius: 8, background: "rgba(3,12,24,.5)", border: "1px solid rgba(6,182,212,.2)" }}>
          <div style={{ fontWeight: 600, marginBottom: 10, color: "#38bdf8" }}>
            Logging: {TASKS.find(t => t.id === sel)?.label}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="fg" style={{ flex: 1, minWidth: 180 }}><label className="fl">Notes (optional)</label>
              <input type="text" className="fi" placeholder="Condition, observations..." value={notes} onChange={e => { setNotes(e.target.value); setAiSuggested(false); }} /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-teal" onClick={log}>✓ Mark Complete</button>
            <button className="btn btn-ghost" onClick={() => { setSel(null); setAiSuggested(false); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
    {rows.length > 0 && <div className="card"><div className="card-title">History</div>
      {[...rows].reverse().slice(0, 20).map((r, i) => {
        const t = TASKS.find(x => x.id === r.task);
        return (
          <div className="entry" key={i}>
            <div><span style={{ marginRight: 5 }}>{t?.icon}</span>
              <span style={{ fontWeight: 600, marginRight: 8 }}>{fmt(r.date)}</span>
              <span style={{ color: "#38bdf8" }}>{t?.label || r.task}</span>
              {r.notes && <span style={{ opacity: .4, fontSize: ".7rem", marginLeft: 6 }}>· {r.notes}</span>}
            </div>
            <button className="del" onClick={() => { const up = rows.filter((_, x) => x !== rows.length - 1 - i); setRows(up); DB.set("maint", up); }}>✕</button>
          </div>
        );
      })}
    </div>}
  </>;
}
