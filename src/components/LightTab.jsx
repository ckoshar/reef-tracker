import { useState } from "react";
import { LIGHTS } from "../utils/constants";
import { tod, fmt } from "../utils/helpers";
import DB from "../utils/db";

export default function LightTab({ rows, setRows }) {
  const [type, setType] = useState("Schedule Check");
  const [date, setDate] = useState(tod());
  const [notes, setNotes] = useState("");

  const save = async () => {
    const up = [...rows, { date, type, notes }].sort((a, b) => a.date.localeCompare(b.date));
    setRows(up); await DB.set("light", up); setNotes("");
  };
  const del = async i => { const up = rows.filter((_, x) => x !== rows.length - 1 - i); setRows(up); await DB.set("light", up); };

  return <>
    <div className="sec-title">Lighting Log</div>
    <div className="card">
      <div className="card-title">Log Lighting Event</div>
      <div style={{ marginBottom: 12 }}>
        <div className="fl" style={{ marginBottom: 8 }}>Event Type</div>
        <div className="chips">{LIGHTS.map(l => <button key={l} className={`chip ${type === l ? "on" : ""}`} onClick={() => setType(l)}>{l}</button>)}</div>
      </div>
      <div className="fgrid" style={{ gridTemplateColumns: "1fr 2fr" }}>
        <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="fg"><label className="fl">Notes</label><textarea className="fi" placeholder="Schedule details, intensity settings, coral response..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
      </div>
      <button className="btn btn-teal" onClick={save}>Log Entry</button>
    </div>
    {rows.length > 0 && <div className="card"><div className="card-title">History</div>
      {[...rows].reverse().slice(0, 15).map((r, i) => (
        <div className="entry" key={i}>
          <div><span style={{ fontWeight: 600, marginRight: 8 }}>{fmt(r.date)}</span>
            <span style={{ color: "#fbbf24", marginRight: 6 }}>{r.type}</span>
            {r.notes && <span style={{ opacity: .6, fontSize: ".73rem" }}>· {r.notes}</span>}
          </div>
          <button className="del" onClick={() => del(i)}>✕</button>
        </div>
      ))}
    </div>}
  </>;
}
