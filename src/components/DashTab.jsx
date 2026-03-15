import { PARAMS, TASKS } from "../utils/constants";
import { fmt, daysAgo } from "../utils/helpers";

export default function DashTab({ params, maint, feed, report, busy, onGen }) {
  const last = params[params.length - 1];
  const overdue = TASKS.filter(t => {
    const e = [...maint].filter(l => l.task === t.id).pop();
    return (e ? daysAgo(e.date) : 999) > t.every;
  });
  const lastFeed = feed[feed.length - 1];

  return <>
    <div className="sec-title">Daily Overview</div>
    <div className="card">
      <div className="card-title">Tank Snapshot</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div className="stat-box" style={{ background: overdue.length ? "rgba(244,63,94,.07)" : "rgba(52,211,153,.07)", border: `1px solid ${overdue.length ? "rgba(244,63,94,.3)" : "rgba(52,211,153,.3)"}`, borderRadius: 9 }}>
          <span style={{ fontSize: "1.6rem", fontWeight: 700, color: overdue.length ? "#f43f5e" : "#34d399" }}>{overdue.length}</span>
          <span style={{ fontSize: ".65rem", opacity: .6 }}>Tasks Overdue</span>
        </div>
        {last && PARAMS.filter(p => ["temp","salinity","ph","alk","calcium"].includes(p.key)).map(p => (
          <div className="pb" key={p.key}>
            <span className="pb-l">{p.label}</span>
            <span className="pb-v" style={{ color: p.color }}>{last[p.key] || "—"}</span>
            <span className="pb-i">{p.ideal}</span>
          </div>
        ))}
        {lastFeed && (
          <div className="pb" style={{ minWidth: 100 }}>
            <span className="pb-l">Last Fed</span>
            <span className="pb-v" style={{ color: "#34d399", fontSize: ".85rem" }}>{fmt(lastFeed.date)}</span>
            <span className="pb-i">{lastFeed.food}</span>
          </div>
        )}
      </div>
      {overdue.length > 0 && (
        <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 7, background: "rgba(244,63,94,.07)", border: "1px solid rgba(244,63,94,.2)", fontSize: ".74rem", color: "#f43f5e" }}>
          ⚠️ Overdue: {overdue.map(t => t.label).join(" · ")}
        </div>
      )}
    </div>

    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>AI Daily Report</div>
        <button className="btn btn-green" onClick={onGen} disabled={busy}>
          {busy ? "Generating…" : "✨ Generate Report"}
        </button>
      </div>
      {busy ? (
        <div className="rloading">
          <div className="pulse glow" style={{ fontFamily: "Cinzel,serif" }}>Analyzing your tank...</div>
          <div style={{ fontSize: ".72rem" }}>Reading all logs · ~10 seconds</div>
        </div>
      ) : report ? (
        <div className="report">{report}</div>
      ) : (
        <div className="empty">
          <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>🌊</div>
          <div>Hit <strong>Generate Report</strong> to get a personalized daily brief — overdue tasks, parameter trends, feeding notes, and a tip tailored to your tank.</div>
          <div style={{ marginTop: 10, fontSize: ".72rem", opacity: .6 }}>The more you log, the smarter your reports get.</div>
        </div>
      )}
    </div>
  </>;
}
