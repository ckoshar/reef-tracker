import { useState } from "react";
import { tod, fmt } from "../utils/helpers";
import DB from "../utils/db";

const TYPES = [
  { value: "fish", label: "Fish", icon: "🐠", color: "#38bdf8" },
  { value: "coral", label: "Coral", icon: "🪸", color: "#c084fc" },
  { value: "invert", label: "Invertebrate", icon: "🦐", color: "#f97316" },
];

const STATUSES = [
  { value: "healthy", label: "Healthy", color: "#34d399" },
  { value: "stressed", label: "Stressed", color: "#fbbf24" },
  { value: "sick", label: "Sick", color: "#f43f5e" },
  { value: "recovering", label: "Recovering", color: "#60a5fa" },
  { value: "lost", label: "Lost", color: "#94a3b8" },
];

export default function LivestockTab({ rows, setRows }) {
  const [view, setView] = useState("list"); // "list" | "add" | "profile"
  const [profileId, setProfileId] = useState(null);
  const [filter, setFilter] = useState("all");

  // Add form state
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [type, setType] = useState("fish");
  const [dateAdded, setDateAdded] = useState(tod());
  const [placement, setPlacement] = useState("");
  const [status, setStatus] = useState("healthy");
  const [notes, setNotes] = useState("");

  // Event log state
  const [eventNote, setEventNote] = useState("");
  const [eventDate, setEventDate] = useState(tod());
  const [newStatus, setNewStatus] = useState("");

  const resetForm = () => {
    setName(""); setSpecies(""); setType("fish"); setDateAdded(tod());
    setPlacement(""); setStatus("healthy"); setNotes("");
  };

  const addAnimal = async () => {
    if (!name.trim()) return;
    const animal = {
      id: Date.now().toString(),
      name: name.trim(), species: species.trim(), type, dateAdded,
      placement: placement.trim(), status, notes: notes.trim(),
      history: [{ date: dateAdded, note: "Added to tank", type: "added" }],
    };
    const updated = [...rows, animal];
    setRows(updated);
    await DB.set("livestock", updated);
    resetForm();
    setView("list");
  };

  const logEvent = async (id) => {
    if (!eventNote.trim()) return;
    const updated = rows.map(a => {
      if (a.id !== id) return a;
      const newHistory = [...a.history, { date: eventDate, note: eventNote.trim(), type: "observation" }];
      return { ...a, history: newHistory, status: newStatus || a.status };
    });
    setRows(updated);
    await DB.set("livestock", updated);
    setEventNote(""); setNewStatus("");
  };

  const updateStatus = async (id, s) => {
    const updated = rows.map(a => {
      if (a.id !== id) return a;
      const newHistory = [...a.history, { date: tod(), note: `Status changed to ${s}`, type: "status" }];
      return { ...a, status: s, history: newHistory };
    });
    setRows(updated);
    await DB.set("livestock", updated);
  };

  const removeAnimal = async (id) => {
    const updated = rows.filter(a => a.id !== id);
    setRows(updated);
    await DB.set("livestock", updated);
    if (profileId === id) { setView("list"); setProfileId(null); }
  };

  const animal = rows.find(a => a.id === profileId);
  const filtered = filter === "all" ? rows : rows.filter(a => a.type === filter);
  const counts = { fish: rows.filter(a => a.type === "fish" && a.status !== "lost").length, coral: rows.filter(a => a.type === "coral" && a.status !== "lost").length, invert: rows.filter(a => a.type === "invert" && a.status !== "lost").length };

  return <>
    <div className="sec-title">Livestock Profiles</div>

    {/* Quick Stats */}
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
      {TYPES.map(t => (
        <div className="pb" key={t.value} style={{ minWidth: 80, cursor: "pointer", borderColor: filter === t.value ? t.color : undefined }}
          onClick={() => setFilter(filter === t.value ? "all" : t.value)}>
          <span style={{ fontSize: "1.1rem" }}>{t.icon}</span>
          <span className="pb-l">{t.label}</span>
          <span className="pb-v" style={{ color: t.color }}>{counts[t.value]}</span>
        </div>
      ))}
      <div className="pb" style={{ minWidth: 80 }}>
        <span style={{ fontSize: "1.1rem" }}>📊</span>
        <span className="pb-l">Total</span>
        <span className="pb-v" style={{ color: "#06b6d4" }}>{counts.fish + counts.coral + counts.invert}</span>
      </div>
    </div>

    {/* Action buttons */}
    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
      {view !== "add" && <button className="btn btn-green" onClick={() => setView("add")}>➕ Add Livestock</button>}
      {view !== "list" && <button className="btn btn-ghost" onClick={() => { setView("list"); setProfileId(null); }}>← Back to List</button>}
    </div>

    {/* ADD FORM */}
    {view === "add" && (
      <div className="card">
        <div className="card-title">Add New Livestock</div>
        <div style={{ marginBottom: 12 }}>
          <div className="fl" style={{ marginBottom: 8 }}>Type</div>
          <div className="chips">
            {TYPES.map(t => (
              <button key={t.value} className={`chip ${type === t.value ? "on" : ""}`}
                onClick={() => setType(t.value)}
                style={type === t.value ? { borderColor: t.color, color: t.color, background: `${t.color}18` } : {}}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="fgrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="fg"><label className="fl">Name</label><input type="text" className="fi" placeholder="e.g., Nemo" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="fg"><label className="fl">Species</label><input type="text" className="fi" placeholder="e.g., Ocellaris Clownfish" value={species} onChange={e => setSpecies(e.target.value)} /></div>
          <div className="fg"><label className="fl">Date Added</label><input type="date" className="fi" value={dateAdded} onChange={e => setDateAdded(e.target.value)} /></div>
          <div className="fg"><label className="fl">Placement</label><input type="text" className="fi" placeholder="e.g., top left rock" value={placement} onChange={e => setPlacement(e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div className="fl" style={{ marginBottom: 8 }}>Initial Status</div>
          <div className="chips">
            {STATUSES.filter(s => s.value !== "lost").map(s => (
              <button key={s.value} className={`chip ${status === s.value ? "on" : ""}`}
                onClick={() => setStatus(s.value)}
                style={status === s.value ? { borderColor: s.color, color: s.color, background: `${s.color}18` } : {}}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="fg" style={{ marginBottom: 12 }}>
          <label className="fl">Notes</label>
          <textarea className="fi" placeholder="Where purchased, acclimation notes, initial observations..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-teal" onClick={addAnimal}>Add to Tank</button>
          <button className="btn btn-ghost" onClick={() => { resetForm(); setView("list"); }}>Cancel</button>
        </div>
      </div>
    )}

    {/* PROFILE VIEW */}
    {view === "profile" && animal && (
      <>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: TYPES.find(t => t.value === animal.type)?.color, marginBottom: 4 }}>
                {TYPES.find(t => t.value === animal.type)?.icon} {animal.name}
              </div>
              <div style={{ fontSize: ".78rem", opacity: .6, marginBottom: 2 }}>{animal.species}</div>
              <div style={{ fontSize: ".7rem", opacity: .4 }}>Added {fmt(animal.dateAdded)}{animal.placement ? ` · ${animal.placement}` : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {(() => { const s = STATUSES.find(s => s.value === animal.status); return (
                <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: ".7rem", fontWeight: 700, background: `${s?.color}18`, color: s?.color, border: `1px solid ${s?.color}35` }}>
                  {s?.label}
                </span>
              );})()}
            </div>
          </div>
          {animal.notes && <div style={{ fontSize: ".78rem", opacity: .55, marginTop: 10, lineHeight: 1.6 }}>{animal.notes}</div>}

          {/* Quick status update */}
          <div style={{ marginTop: 14 }}>
            <div className="fl" style={{ marginBottom: 6 }}>Update Status</div>
            <div className="chips">
              {STATUSES.map(s => (
                <button key={s.value} className={`chip ${animal.status === s.value ? "on" : ""}`}
                  onClick={() => updateStatus(animal.id, s.value)}
                  style={animal.status === s.value ? { borderColor: s.color, color: s.color, background: `${s.color}18` } : {}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Log Event */}
        <div className="card">
          <div className="card-title">Log Observation</div>
          <div className="fgrid" style={{ gridTemplateColumns: "auto 1fr" }}>
            <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={eventDate} onChange={e => setEventDate(e.target.value)} /></div>
            <div className="fg"><label className="fl">Note</label><input type="text" className="fi" placeholder="Eating well, showing color, moved spots..." value={eventNote} onChange={e => setEventNote(e.target.value)} /></div>
          </div>
          <button className="btn btn-teal" onClick={() => logEvent(animal.id)}>Add Note</button>
        </div>

        {/* History */}
        <div className="card">
          <div className="card-title">History ({animal.history.length} events)</div>
          {[...animal.history].reverse().map((h, i) => (
            <div className="entry" key={i} style={{ borderLeftColor: h.type === "status" ? "#fbbf24" : h.type === "added" ? "#34d399" : "rgba(6,182,212,.25)" }}>
              <div>
                <span style={{ fontWeight: 600, marginRight: 8 }}>{fmt(h.date)}</span>
                <span style={{ fontSize: ".76rem", opacity: .7 }}>{h.note}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-red" style={{ marginTop: 8 }} onClick={() => removeAnimal(animal.id)}>Remove from Tank</button>
      </>
    )}

    {/* LIST VIEW */}
    {view === "list" && (
      <>
        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty">
              <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>🐠</div>
              <div>Add your fish, coral, and invertebrates to track them individually.</div>
              <div style={{ marginTop: 10, fontSize: ".72rem", opacity: .6 }}>
                Individual profiles let the AI give health advice specific to each animal.
              </div>
            </div>
          </div>
        ) : (
          TYPES.map(typeGroup => {
            const items = filtered.filter(a => a.type === typeGroup.value);
            if (items.length === 0) return null;
            return (
              <div className="card" key={typeGroup.value}>
                <div className="card-title">{typeGroup.icon} {typeGroup.label} ({items.length})</div>
                {items.map(a => {
                  const sts = STATUSES.find(s => s.value === a.status);
                  const lastEvent = a.history[a.history.length - 1];
                  return (
                    <div className="entry" key={a.id} style={{ cursor: "pointer", borderLeftColor: sts?.color || "rgba(6,182,212,.25)" }}
                      onClick={() => { setProfileId(a.id); setView("profile"); setEventDate(tod()); }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, marginRight: 6, color: typeGroup.color }}>{a.name}</span>
                        <span style={{ fontSize: ".73rem", opacity: .5, marginRight: 6 }}>{a.species}</span>
                        <span style={{ padding: "1px 7px", borderRadius: 10, fontSize: ".6rem", fontWeight: 700, background: `${sts?.color}18`, color: sts?.color }}>
                          {sts?.label}
                        </span>
                        {lastEvent && (
                          <span style={{ fontSize: ".65rem", opacity: .35, marginLeft: 8 }}>
                            Last: {fmt(lastEvent.date)} — {lastEvent.note.substring(0, 40)}{lastEvent.note.length > 40 ? "..." : ""}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: ".7rem", opacity: .3 }}>→</span>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </>
    )}
  </>;
}
