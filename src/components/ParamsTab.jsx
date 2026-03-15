import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PARAMS, TIME_CONTEXTS } from "../utils/constants";
import { tod, fmt, fmtTime } from "../utils/helpers";
import DB from "../utils/db";

export default function ParamsTab({ rows, setRows }) {
  const blank = { date: tod(), time: "", context: [], ...Object.fromEntries(PARAMS.map(p => [p.key, ""])), notes: "" };
  const [form, setForm] = useState(blank);
  const [chart, setChart] = useState("temp");
  const [mode, setMode] = useState("full"); // "full" or "quick"
  const [quickParams, setQuickParams] = useState(["temp"]); // which params in quick mode

  const toggleQuickParam = (key) => {
    setQuickParams(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleContext = (tag) => {
    setForm(prev => ({
      ...prev,
      context: prev.context.includes(tag) ? prev.context.filter(t => t !== tag) : [...prev.context, tag],
    }));
  };

  const save = async () => {
    const entry = { ...form };
    if (mode === "quick") {
      PARAMS.forEach(p => {
        if (!quickParams.includes(p.key)) entry[p.key] = "";
      });
    }
    const up = [...rows, entry].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return (a.time || "").localeCompare(b.time || "");
    });
    setRows(up); await DB.set("params", up);
    setForm({ ...blank, date: tod() });
  };

  const del = async i => { const up = rows.filter((_, x) => x !== i); setRows(up); await DB.set("params", up); };

  const cfg = PARAMS.find(p => p.key === chart);
  const cd = rows.map(r => {
    const v = parseFloat(r[chart]);
    if (isNaN(v) || v === null) return null;
    const label = r.time ? `${fmt(r.date)} ${fmtTime(r.time)}` : fmt(r.date);
    return { date: label, v, context: r.context?.join(", ") || "" };
  }).filter(Boolean);

  const visibleParams = mode === "quick" ? PARAMS.filter(p => quickParams.includes(p.key)) : PARAMS;

  return <>
    <div className="sec-title">Water Parameters</div>

    {/* Mode Toggle */}
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Log Test Results</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button className={`btn btn-sm ${mode === "full" ? "btn-teal" : "btn-ghost"}`} onClick={() => setMode("full")}>Full Test</button>
          <button className={`btn btn-sm ${mode === "quick" ? "btn-teal" : "btn-ghost"}`} onClick={() => setMode("quick")}>Quick Test</button>
        </div>
      </div>

      {/* Quick mode: param selector */}
      {mode === "quick" && (
        <div style={{ marginBottom: 14 }}>
          <div className="fl" style={{ marginBottom: 6 }}>Select Parameters to Log</div>
          <div className="chips">
            {PARAMS.map(p => (
              <button key={p.key} className={`chip ${quickParams.includes(p.key) ? "on" : ""}`}
                onClick={() => toggleQuickParam(p.key)}
                style={quickParams.includes(p.key) ? { borderColor: p.color, color: p.color, background: `${p.color}18` } : {}}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date & Time */}
      <div className="fgrid" style={{ gridTemplateColumns: mode === "quick" ? "1fr 1fr" : "repeat(auto-fill,minmax(130px,1fr))" }}>
        <div className="fg">
          <label className="fl">Date</label>
          <input type="date" className="fi" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="fg">
          <label className="fl">Time <span style={{ opacity: .4, fontSize: ".55rem" }}>(optional)</span></label>
          <input type="time" className="fi" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
        </div>
      </div>

      {/* Context Tags */}
      <div style={{ marginBottom: 12 }}>
        <div className="fl" style={{ marginBottom: 6 }}>Context <span style={{ opacity: .4, fontSize: ".55rem" }}>(optional)</span></div>
        <div className="chips">
          {TIME_CONTEXTS.map(tag => (
            <button key={tag} className={`chip ${form.context.includes(tag) ? "on" : ""}`}
              onClick={() => toggleContext(tag)}
              style={{ fontSize: ".65rem" }}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Parameter Inputs */}
      <div className="fgrid">
        {visibleParams.map(p => (
          <div className="fg" key={p.key}>
            <label className="fl">{p.label} <span style={{ opacity: .45, fontSize: ".58rem" }}>({p.ideal})</span></label>
            <input type="number" step="any" className="fi" placeholder={p.ideal} value={form[p.key]}
              onChange={e => setForm({ ...form, [p.key]: e.target.value })} />
          </div>
        ))}
      </div>

      <div className="fg" style={{ marginBottom: 12 }}>
        <label className="fl">Notes</label>
        <input type="text" className="fi" placeholder="Observations..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
      <button className="btn btn-teal" onClick={save}>Save Test</button>
    </div>

    {/* Chart */}
    {rows.length > 1 && (
      <div className="card">
        <div className="card-title">Trend Chart</div>
        <div className="chips">
          {PARAMS.map(p => (
            <button key={p.key} className={`chip ${chart === p.key ? "on" : ""}`}
              onClick={() => setChart(p.key)}
              style={chart === p.key ? { borderColor: p.color, color: p.color, background: `${p.color}18` } : {}}>{p.label}</button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={cd}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(200,230,245,.4)" }} />
            <YAxis tick={{ fontSize: 9, fill: "rgba(200,230,245,.4)" }} domain={[cfg.min, cfg.max]} />
            <Tooltip
              contentStyle={{ background: "#05162e", border: "1px solid rgba(6,182,212,.3)", borderRadius: 8, fontSize: 11 }}
              formatter={(value) => [value, cfg.label]}
            />
            <Line type="monotone" dataKey="v" stroke={cfg.color} strokeWidth={2} dot={{ fill: cfg.color, r: 3 }} name={cfg.label} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}

    {/* History */}
    {rows.length > 0 && (
      <div className="card">
        <div className="card-title">History ({rows.length} entries)</div>
        {[...rows].reverse().slice(0, 20).map((r, i) => {
          const contexts = r.context || [];
          return (
            <div className="entry" key={i}>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, marginRight: 6 }}>{fmt(r.date)}</span>
                {r.time && <span style={{ fontSize: ".7rem", color: "#06b6d4", marginRight: 6 }}>{fmtTime(r.time)}</span>}
                {contexts.length > 0 && contexts.map(c => (
                  <span key={c} style={{
                    display: "inline-block", padding: "1px 6px", borderRadius: 8, fontSize: ".58rem",
                    fontWeight: 600, background: "rgba(6,182,212,.1)", color: "rgba(6,182,212,.6)",
                    marginRight: 4,
                  }}>{c}</span>
                ))}
                <br />
                <span style={{ fontSize: ".73rem", opacity: .65 }}>
                  {r.temp && `T:${r.temp} `}{r.salinity && `Sal:${r.salinity} `}{r.ph && `pH:${r.ph} `}
                  {r.alk && `Alk:${r.alk} `}{r.calcium && `Ca:${r.calcium} `}{r.mag && `Mg:${r.mag} `}
                  {r.nitrate && `NO3:${r.nitrate} `}{r.ammonia && `NH3:${r.ammonia} `}{r.nitrite && `NO2:${r.nitrite}`}
                </span>
                {r.notes && <span style={{ opacity: .4, fontSize: ".7rem", marginLeft: 6 }}>· {r.notes}</span>}
              </div>
              <button className="del" onClick={() => del(rows.length - 1 - i)}>✕</button>
            </div>
          );
        })}
      </div>
    )}
  </>;
}
