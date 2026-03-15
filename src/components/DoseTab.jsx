import { useState } from "react";
import { DOSES } from "../utils/constants";
import { tod, fmt } from "../utils/helpers";
import DB from "../utils/db";
import { smartFill } from "../utils/ai";

export default function DoseTab({ rows, setRows, getCtx }) {
  const [prod, setProd] = useState("Two Part A");
  const [amt, setAmt]   = useState("");
  const [date, setDate] = useState(tod());
  const [notes, setNotes] = useState("");
  const [filling, setFilling] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);

  const save = async () => {
    const up = [...rows, { date, product: prod, amount: amt, notes }].sort((a, b) => a.date.localeCompare(b.date));
    setRows(up); await DB.set("dose", up); setAmt(""); setNotes(""); setAiSuggested(false);
  };
  const del = async i => { const up = rows.filter((_, x) => x !== rows.length - 1 - i); setRows(up); await DB.set("dose", up); };

  const handleSmartFill = async () => {
    setFilling(true);
    const result = await smartFill("dose", getCtx());
    if (result) {
      if (result.product) setProd(result.product);
      if (result.amount) setAmt(result.amount);
      if (result.notes) setNotes(result.notes);
      setAiSuggested(true);
    }
    setFilling(false);
  };

  return <>
    <div className="sec-title">Dosing Log</div>
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div className="card-title">Log Dose</div>
        <button className="btn btn-ghost btn-sm" onClick={handleSmartFill} disabled={filling}>
          {filling ? "🤖 Thinking..." : "✨ Smart Fill"}
        </button>
      </div>
      {aiSuggested && (
        <div style={{ fontSize: ".7rem", color: "#06b6d4", marginBottom: 10, padding: "5px 10px", borderRadius: 6, background: "rgba(6,182,212,.08)", border: "1px solid rgba(6,182,212,.2)" }}>
          🤖 AI suggested — review and edit before saving
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <div className="fl" style={{ marginBottom: 8 }}>Product</div>
        <div className="chips">{DOSES.map(d => <button key={d} className={`chip ${prod === d ? "on" : ""}`} onClick={() => { setProd(d); setAiSuggested(false); }}>{d}</button>)}</div>
      </div>
      <div className="fgrid" style={{ gridTemplateColumns: "1fr 1fr 2fr" }}>
        <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="fg"><label className="fl">Amount</label><input type="text" className="fi" placeholder="10ml" value={amt} onChange={e => { setAmt(e.target.value); setAiSuggested(false); }} /></div>
        <div className="fg"><label className="fl">Notes</label><input type="text" className="fi" placeholder="Reason, observations..." value={notes} onChange={e => { setNotes(e.target.value); setAiSuggested(false); }} /></div>
      </div>
      <button className="btn btn-teal" onClick={save}>Log Dose</button>
    </div>
    {rows.length > 0 && <div className="card"><div className="card-title">History</div>
      {[...rows].reverse().slice(0, 20).map((r, i) => (
        <div className="entry" key={i}>
          <div><span style={{ fontWeight: 600, marginRight: 8 }}>{fmt(r.date)}</span>
            <span style={{ color: "#c084fc", marginRight: 6 }}>{r.product}</span>
            {r.amount && <span style={{ opacity: .7, fontSize: ".73rem" }}>{r.amount}</span>}
            {r.notes && <span style={{ opacity: .4, fontSize: ".7rem", marginLeft: 6 }}>· {r.notes}</span>}
          </div>
          <button className="del" onClick={() => del(i)}>✕</button>
        </div>
      ))}
    </div>}
  </>;
}
