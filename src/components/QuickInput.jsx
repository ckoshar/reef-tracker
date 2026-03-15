import { useState } from "react";
import { PARAMS, TASKS, FOODS, DOSES } from "../utils/constants";
import { tod } from "../utils/helpers";
import DB from "../utils/db";

// ── Category definitions for quick input ─────────────────────────────────
const INPUT_TYPES = [
  { id: "params",  label: "Parameters", icon: "🧪", color: "#a78bfa" },
  { id: "feed",    label: "Feeding",    icon: "🐡", color: "#f97316" },
  { id: "maint",   label: "Maintenance",icon: "🔧", color: "#34d399" },
  { id: "dose",    label: "Dosing",     icon: "💊", color: "#c084fc" },
  { id: "journal", label: "Journal",    icon: "📝", color: "#38bdf8" },
  { id: "notes",   label: "Quick Note", icon: "📌", color: "#94a3b8" },
];

export default function QuickInput({ params, setParams, feed, setFeed, maint, setMaint, dose, setDose, journal, setJournal }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("params");
  const [saved, setSaved] = useState(null);

  // Parameter form
  const paramBlank = { date: tod(), ...Object.fromEntries(PARAMS.map(p => [p.key, ""])), notes: "" };
  const [paramForm, setParamForm] = useState(paramBlank);

  // Feed form
  const [feedForm, setFeedForm] = useState({ date: tod(), food: "Pellets", amount: "", notes: "" });

  // Maint form
  const [maintTask, setMaintTask] = useState("");
  const [maintForm, setMaintForm] = useState({ date: tod(), notes: "" });

  // Dose form
  const [doseForm, setDoseForm] = useState({ date: tod(), product: "Two Part A", amount: "", notes: "" });

  // Journal form
  const [journalForm, setJournalForm] = useState({ date: tod(), content: "" });

  // Notes form (goes to journal)
  const [noteText, setNoteText] = useState("");

  const flash = (msg) => {
    setSaved(msg);
    setTimeout(() => setSaved(null), 2000);
  };

  const saveParams = async () => {
    const entry = { ...paramForm };
    // Only keep params that have values
    const hasValues = PARAMS.some(p => entry[p.key] !== "");
    if (!hasValues) return;
    const up = [...params, entry].sort((a, b) => a.date.localeCompare(b.date));
    setParams(up);
    await DB.set("params", up);
    setParamForm({ ...paramBlank, date: tod() });
    flash("Parameters saved to Parameters tab");
  };

  const saveFeed = async () => {
    if (!feedForm.food) return;
    const up = [...feed, feedForm].sort((a, b) => a.date.localeCompare(b.date));
    setFeed(up);
    await DB.set("feed", up);
    setFeedForm({ date: tod(), food: "Pellets", amount: "", notes: "" });
    flash("Feeding logged to Feeding tab");
  };

  const saveMaint = async () => {
    if (!maintTask) return;
    const up = [...maint, { date: maintForm.date, task: maintTask, notes: maintForm.notes }].sort((a, b) => a.date.localeCompare(b.date));
    setMaint(up);
    await DB.set("maint", up);
    setMaintTask("");
    setMaintForm({ date: tod(), notes: "" });
    flash("Maintenance logged to Maintenance tab");
  };

  const saveDose = async () => {
    if (!doseForm.product) return;
    const up = [...dose, doseForm].sort((a, b) => a.date.localeCompare(b.date));
    setDose(up);
    await DB.set("dose", up);
    setDoseForm({ date: tod(), product: "Two Part A", amount: "", notes: "" });
    flash("Dose logged to Dosing tab");
  };

  const saveJournal = async () => {
    if (!journalForm.content.trim()) return;
    const up = [...journal, journalForm].sort((a, b) => a.date.localeCompare(b.date));
    setJournal(up);
    await DB.set("journal", up);
    setJournalForm({ date: tod(), content: "" });
    flash("Entry saved to Journal tab");
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;
    const entry = { date: tod(), content: noteText.trim() };
    const up = [...journal, entry].sort((a, b) => a.date.localeCompare(b.date));
    setJournal(up);
    await DB.set("journal", up);
    setNoteText("");
    flash("Note saved to Journal tab");
  };

  const currentType = INPUT_TYPES.find(t => t.id === type);

  return (
    <div className="quick-input-wrapper">
      {/* Toggle bar */}
      <button
        className="quick-input-toggle"
        onClick={() => setOpen(!open)}
        style={{ borderColor: open ? "rgba(6,182,212,.4)" : undefined }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "1rem" }}>+</span>
          <span>Quick Log</span>
        </span>
        <span style={{ fontSize: ".7rem", opacity: .5 }}>
          {open ? "Close" : "Log data from any page"}
        </span>
      </button>

      {/* Saved confirmation */}
      {saved && (
        <div className="quick-input-saved">{saved}</div>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="quick-input-panel">
          {/* Type selector */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
            {INPUT_TYPES.map(t => (
              <button
                key={t.id}
                className={`chip ${type === t.id ? "on" : ""}`}
                onClick={() => setType(t.id)}
                style={type === t.id ? { borderColor: t.color, color: t.color, background: `${t.color}18` } : { fontSize: ".68rem" }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── Parameters form ── */}
          {type === "params" && (
            <div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label className="fl">Date</label>
                <input type="date" className="fi" value={paramForm.date} onChange={e => setParamForm({ ...paramForm, date: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, marginBottom: 10 }}>
                {PARAMS.map(p => (
                  <div className="fg" key={p.key}>
                    <label className="fl" style={{ fontSize: ".6rem" }}>{p.label}</label>
                    <input type="number" step="any" className="fi" placeholder={p.ideal} value={paramForm[p.key]}
                      onChange={e => setParamForm({ ...paramForm, [p.key]: e.target.value })}
                      style={{ padding: "5px 8px", fontSize: ".78rem" }} />
                  </div>
                ))}
              </div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label className="fl">Notes</label>
                <input type="text" className="fi" placeholder="Observations..." value={paramForm.notes} onChange={e => setParamForm({ ...paramForm, notes: e.target.value })} />
              </div>
              <button className="btn btn-teal btn-sm" onClick={saveParams}>Save Parameters</button>
            </div>
          )}

          {/* ── Feeding form ── */}
          {type === "feed" && (
            <div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {FOODS.map(f => (
                  <button key={f} className={`chip ${feedForm.food === f ? "on" : ""}`} onClick={() => setFeedForm({ ...feedForm, food: f })} style={{ fontSize: ".65rem" }}>{f}</button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8, marginBottom: 10 }}>
                <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={feedForm.date} onChange={e => setFeedForm({ ...feedForm, date: e.target.value })} /></div>
                <div className="fg"><label className="fl">Amount</label><input type="text" className="fi" placeholder="pinch" value={feedForm.amount} onChange={e => setFeedForm({ ...feedForm, amount: e.target.value })} /></div>
                <div className="fg"><label className="fl">Notes</label><input type="text" className="fi" placeholder="Appetite..." value={feedForm.notes} onChange={e => setFeedForm({ ...feedForm, notes: e.target.value })} /></div>
              </div>
              <button className="btn btn-teal btn-sm" onClick={saveFeed}>Log Feeding</button>
            </div>
          )}

          {/* ── Maintenance form ── */}
          {type === "maint" && (
            <div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {TASKS.map(t => (
                  <button key={t.id} className={`chip ${maintTask === t.id ? "on" : ""}`} onClick={() => setMaintTask(t.id)} style={{ fontSize: ".65rem" }}>{t.icon} {t.label}</button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8, marginBottom: 10 }}>
                <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={maintForm.date} onChange={e => setMaintForm({ ...maintForm, date: e.target.value })} /></div>
                <div className="fg"><label className="fl">Notes</label><input type="text" className="fi" placeholder="Condition..." value={maintForm.notes} onChange={e => setMaintForm({ ...maintForm, notes: e.target.value })} /></div>
              </div>
              <button className="btn btn-teal btn-sm" onClick={saveMaint} disabled={!maintTask}>Log Maintenance</button>
            </div>
          )}

          {/* ── Dosing form ── */}
          {type === "dose" && (
            <div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {DOSES.map(d => (
                  <button key={d} className={`chip ${doseForm.product === d ? "on" : ""}`} onClick={() => setDoseForm({ ...doseForm, product: d })} style={{ fontSize: ".65rem" }}>{d}</button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8, marginBottom: 10 }}>
                <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={doseForm.date} onChange={e => setDoseForm({ ...doseForm, date: e.target.value })} /></div>
                <div className="fg"><label className="fl">Amount</label><input type="text" className="fi" placeholder="10ml" value={doseForm.amount} onChange={e => setDoseForm({ ...doseForm, amount: e.target.value })} /></div>
                <div className="fg"><label className="fl">Notes</label><input type="text" className="fi" placeholder="Reason..." value={doseForm.notes} onChange={e => setDoseForm({ ...doseForm, notes: e.target.value })} /></div>
              </div>
              <button className="btn btn-teal btn-sm" onClick={saveDose}>Log Dose</button>
            </div>
          )}

          {/* ── Journal form ── */}
          {type === "journal" && (
            <div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label className="fl">Date</label>
                <input type="date" className="fi" value={journalForm.date} onChange={e => setJournalForm({ ...journalForm, date: e.target.value })} />
              </div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label className="fl">Entry</label>
                <textarea className="fi" rows={3} placeholder="What's happening with your reef today..." value={journalForm.content} onChange={e => setJournalForm({ ...journalForm, content: e.target.value })} />
              </div>
              <button className="btn btn-teal btn-sm" onClick={saveJournal}>Save Journal Entry</button>
            </div>
          )}

          {/* ── Quick Note form ── */}
          {type === "notes" && (
            <div>
              <div className="fg" style={{ marginBottom: 10 }}>
                <label className="fl">Quick Note (saved to Journal)</label>
                <textarea className="fi" rows={2} placeholder="Jot something down..." value={noteText} onChange={e => setNoteText(e.target.value)} />
              </div>
              <button className="btn btn-teal btn-sm" onClick={saveNote}>Save Note</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
