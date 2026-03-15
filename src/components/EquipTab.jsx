import { useState } from "react";
import { EQUIP } from "../utils/constants";
import { tod, fmt } from "../utils/helpers";
import DB from "../utils/db";

export default function EquipTab({ rows, setRows }) {
  const [item, setItem]     = useState("Heater Check");
  const [date, setDate]     = useState(tod());
  const [status, setStatus] = useState("Normal");
  const [notes, setNotes]   = useState("");

  const save = async () => {
    const up = [...rows, { date, item, status, notes }].sort((a, b) => a.date.localeCompare(b.date));
    setRows(up); await DB.set("equip", up); setNotes("");
  };
  const del = async i => { const up = rows.filter((_, x) => x !== rows.length - 1 - i); setRows(up); await DB.set("equip", up); };

  return <>
    <div className="sec-title">Equipment Log</div>
    <div className="card">
      <div className="card-title">Log Equipment Check / Note</div>
      <div style={{ marginBottom: 12 }}>
        <div className="fl" style={{ marginBottom: 8 }}>Equipment</div>
        <div className="chips">{EQUIP.map(e => <button key={e} className={`chip ${item === e ? "on" : ""}`} onClick={() => setItem(e)}>{e}</button>)}</div>
      </div>
      <div className="fgrid" style={{ gridTemplateColumns: "1fr 1fr 2fr" }}>
        <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="fg">
          <label className="fl">Status</label>
          <select className="fi" value={status} onChange={e => setStatus(e.target.value)}>
            {["Normal","Cleaned","Replaced","Adjusted","Issue Found","Repaired"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="fg"><label className="fl">Notes</label><textarea className="fi" placeholder="Details, readings, observations..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
      </div>
      <button className="btn btn-teal" onClick={save}>Log Entry</button>
    </div>
    {rows.length > 0 && <div className="card"><div className="card-title">History</div>
      {[...rows].reverse().slice(0, 15).map((r, i) => {
        const sc = { Normal:"#34d399","Issue Found":"#f43f5e",Replaced:"#f97316",Adjusted:"#fbbf24",Cleaned:"#38bdf8",Repaired:"#c084fc" }[r.status] || "#94a3b8";
        return (
          <div className="entry" key={i}>
            <div><span style={{ fontWeight: 600, marginRight: 8 }}>{fmt(r.date)}</span>
              <span style={{ color: "#60a5fa", marginRight: 6 }}>{r.item}</span>
              <span style={{ color: sc, fontSize: ".72rem", marginRight: 6 }}>({r.status})</span>
              {r.notes && <span style={{ opacity: .55, fontSize: ".7rem" }}>· {r.notes}</span>}
            </div>
            <button className="del" onClick={() => del(i)}>✕</button>
          </div>
        );
      })}
    </div>}
  </>;
}
