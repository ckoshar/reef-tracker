import { useState } from "react";
import { tod, fmt } from "../utils/helpers";
import DB from "../utils/db";

export default function JournalTab({ rows, setRows }) {
  const [editDate, setEditDate] = useState(tod());
  const [content, setContent] = useState("");
  const [viewing, setViewing] = useState(null); // date string of entry being viewed

  // Find entry for a given date
  const entryFor = (date) => rows.find(r => r.date === date);

  // Load an entry into the editor
  const loadEntry = (date) => {
    const entry = entryFor(date);
    setEditDate(date);
    setContent(entry ? entry.content : "");
    setViewing(date);
  };

  // Save current entry
  const save = async () => {
    if (!content.trim()) return;
    const existing = entryFor(editDate);
    let updated;
    if (existing) {
      updated = rows.map(r => r.date === editDate ? { ...r, content: content.trim(), editedAt: new Date().toISOString() } : r);
    } else {
      updated = [...rows, { date: editDate, content: content.trim(), createdAt: new Date().toISOString() }]
        .sort((a, b) => b.date.localeCompare(a.date));
    }
    setRows(updated);
    await DB.set("journal", updated);
    setViewing(editDate);
  };

  // Delete an entry
  const del = async (date) => {
    const updated = rows.filter(r => r.date !== date);
    setRows(updated);
    await DB.set("journal", updated);
    if (viewing === date) { setViewing(null); setContent(""); }
  };

  // Start new entry for today
  const newToday = () => {
    const today = tod();
    const entry = entryFor(today);
    setEditDate(today);
    setContent(entry ? entry.content : "");
    setViewing(today);
  };

  // Get last 30 days that have entries, sorted newest first
  const sortedEntries = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const todayEntry = entryFor(tod());

  return <>
    <div className="sec-title">Daily Journal</div>

    {/* Quick Actions */}
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      <button className="btn btn-green" onClick={newToday}>
        {todayEntry ? "✏️ Edit Today's Entry" : "📝 Write Today's Entry"}
      </button>
      {viewing && (
        <button className="btn btn-ghost" onClick={() => { setViewing(null); setContent(""); }}>
          ← Back to List
        </button>
      )}
    </div>

    {/* Editor View */}
    {viewing !== null && (
      <div className="card">
        <div className="card-title">
          {entryFor(editDate) ? "✏️ Editing" : "📝 New Entry"} — {fmt(editDate)}
        </div>
        <div className="fg" style={{ marginBottom: 12 }}>
          <label className="fl">Date</label>
          <input type="date" className="fi" value={editDate} onChange={e => {
            const d = e.target.value;
            setEditDate(d);
            const existing = entryFor(d);
            setContent(existing ? existing.content : "");
          }} />
        </div>
        <div className="fg" style={{ marginBottom: 12 }}>
          <label className="fl">Journal Entry</label>
          <textarea
            className="fi"
            style={{ minHeight: 200, lineHeight: 1.7, fontSize: ".85rem" }}
            placeholder="What's happening with your tank today? Observations, experiments, concerns, wins..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-teal" onClick={save}>
            {entryFor(editDate) ? "Update Entry" : "Save Entry"}
          </button>
          <span style={{ fontSize: ".7rem", opacity: .4 }}>
            {content.length} characters
          </span>
        </div>
        {entryFor(editDate)?.editedAt && (
          <div style={{ fontSize: ".65rem", opacity: .35, marginTop: 8 }}>
            Last edited: {new Date(entryFor(editDate).editedAt).toLocaleString()}
          </div>
        )}
      </div>
    )}

    {/* Entry List */}
    {viewing === null && (
      <>
        {sortedEntries.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>📝</div>
              <div>Start your reef journal! Track daily observations, experiments, concerns, and wins.</div>
              <div style={{ marginTop: 10, fontSize: ".72rem", opacity: .6 }}>
                The AI reads your journal entries to give smarter, more personalized advice.
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-title">Journal Entries ({sortedEntries.length})</div>
            {sortedEntries.map(entry => (
              <div key={entry.date} className="entry" style={{ flexDirection: "column", alignItems: "stretch", borderLeftColor: entry.date === tod() ? "#06b6d4" : "rgba(6,182,212,.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600, marginRight: 8, color: entry.date === tod() ? "#06b6d4" : "var(--text)" }}>
                      {fmt(entry.date)}
                    </span>
                    {entry.date === tod() && <span style={{ fontSize: ".63rem", color: "#06b6d4", fontWeight: 700 }}>TODAY</span>}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="del" style={{ color: "rgba(56,189,248,.4)" }} onClick={() => loadEntry(entry.date)} title="Edit">✎</button>
                    <button className="del" onClick={() => del(entry.date)} title="Delete">✕</button>
                  </div>
                </div>
                <div
                  style={{ fontSize: ".78rem", opacity: .7, lineHeight: 1.6, whiteSpace: "pre-wrap", cursor: "pointer", maxHeight: 80, overflow: "hidden" }}
                  onClick={() => loadEntry(entry.date)}
                >
                  {entry.content}
                </div>
                {entry.content.length > 200 && (
                  <div style={{ fontSize: ".68rem", color: "#06b6d4", cursor: "pointer", marginTop: 4 }} onClick={() => loadEntry(entry.date)}>
                    Read more →
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </>;
}
