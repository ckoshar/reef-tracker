import { useState } from "react";
import { INVENTORY_CATEGORIES, QUANTITY_LEVELS, FOODS, DOSES } from "../utils/constants";
import DB from "../utils/db";

const SUGGESTIONS = {
  food: FOODS,
  salt: ["Red Sea Coral Pro", "Instant Ocean", "Fritz RPM", "Tropic Marin", "Reef Crystals", "Other"],
  chemicals: DOSES,
  consumables: ["Filter Floss", "Carbon", "GFO", "Bio Media", "Test Kit Reagents", "Frag Plugs", "Replacement Pump", "Heater Backup", "Other"],
};

export default function InventoryTab({ rows, setRows }) {
  const [cat, setCat]     = useState("food");
  const [name, setName]   = useState("");
  const [brand, setBrand] = useState("");
  const [qty, setQty]     = useState("full");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState(null);

  const save = async () => {
    if (!name.trim()) return;
    let updated;
    if (editing !== null) {
      updated = rows.map((r, i) => i === editing ? { category: cat, name: name.trim(), brand: brand.trim(), quantity: qty, notes: notes.trim() } : r);
      setEditing(null);
    } else {
      updated = [...rows, { category: cat, name: name.trim(), brand: brand.trim(), quantity: qty, notes: notes.trim() }];
    }
    setRows(updated);
    await DB.set("inventory", updated);
    setName(""); setBrand(""); setQty("full"); setNotes("");
  };

  const del = async (i) => {
    const updated = rows.filter((_, x) => x !== i);
    setRows(updated);
    await DB.set("inventory", updated);
    if (editing === i) { setEditing(null); setName(""); setBrand(""); setQty("full"); setNotes(""); }
  };

  const startEdit = (i) => {
    const item = rows[i];
    setCat(item.category);
    setName(item.name);
    setBrand(item.brand || "");
    setQty(item.quantity);
    setNotes(item.notes || "");
    setEditing(i);
  };

  const cancelEdit = () => {
    setEditing(null);
    setName(""); setBrand(""); setQty("full"); setNotes("");
  };

  const catItems = (category) => rows.filter(r => r.category === category);
  const activeCat = INVENTORY_CATEGORIES.find(c => c.key === cat);

  return <>
    <div className="sec-title">Supply Inventory</div>

    {/* Quick Stats */}
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
      {INVENTORY_CATEGORIES.map(c => {
        const items = catItems(c.key);
        const lowCount = items.filter(i => i.quantity === "low" || i.quantity === "empty").length;
        return (
          <div className="pb" key={c.key} style={{ minWidth: 90, cursor: "pointer", borderColor: cat === c.key ? c.color : undefined }}
            onClick={() => setCat(c.key)}>
            <span style={{ fontSize: "1.1rem" }}>{c.icon}</span>
            <span className="pb-l">{c.label}</span>
            <span className="pb-v" style={{ color: c.color, fontSize: ".9rem" }}>{items.length}</span>
            {lowCount > 0 && <span style={{ fontSize: ".6rem", color: "#f97316" }}>{lowCount} low/empty</span>}
          </div>
        );
      })}
    </div>

    {/* Add / Edit Form */}
    <div className="card">
      <div className="card-title">{editing !== null ? "✏️ Edit Item" : "➕ Add Supply"}</div>
      <div style={{ marginBottom: 12 }}>
        <div className="fl" style={{ marginBottom: 8 }}>Category</div>
        <div className="chips">
          {INVENTORY_CATEGORIES.map(c => (
            <button key={c.key} className={`chip ${cat === c.key ? "on" : ""}`}
              onClick={() => setCat(c.key)}
              style={cat === c.key ? { borderColor: c.color, color: c.color, background: `${c.color}18` } : {}}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="fl" style={{ marginBottom: 8 }}>Quick Select</div>
        <div className="chips">
          {(SUGGESTIONS[cat] || []).map(s => (
            <button key={s} className={`chip ${name === s ? "on" : ""}`} onClick={() => setName(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="fgrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="fg">
          <label className="fl">Item Name</label>
          <input type="text" className="fi" placeholder="e.g., Reef Roids" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="fg">
          <label className="fl">Brand (optional)</label>
          <input type="text" className="fi" placeholder="e.g., Polyplab" value={brand} onChange={e => setBrand(e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="fl" style={{ marginBottom: 8 }}>Quantity Level</div>
        <div className="chips">
          {QUANTITY_LEVELS.map(q => (
            <button key={q.value} className={`chip ${qty === q.value ? "on" : ""}`}
              onClick={() => setQty(q.value)}
              style={qty === q.value ? { borderColor: q.color, color: q.color, background: `${q.color}18` } : {}}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="fg" style={{ marginBottom: 12 }}>
        <label className="fl">Notes (optional)</label>
        <input type="text" className="fi" placeholder="Size, expiration, where to buy..." value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-teal" onClick={save}>{editing !== null ? "✓ Update Item" : "Add to Inventory"}</button>
        {editing !== null && <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>}
      </div>
    </div>

    {/* Inventory List by Category */}
    {INVENTORY_CATEGORIES.map(c => {
      const items = catItems(c.key);
      if (items.length === 0) return null;
      return (
        <div className="card" key={c.key}>
          <div className="card-title">{c.icon} {c.label} ({items.length})</div>
          {items.map((item, idx) => {
            const realIdx = rows.indexOf(item);
            const qLevel = QUANTITY_LEVELS.find(q => q.value === item.quantity);
            return (
              <div className="entry" key={realIdx} style={{ borderLeftColor: qLevel?.color || "rgba(6,182,212,.25)" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, marginRight: 8, color: qLevel?.color }}>{item.name}</span>
                  {item.brand && <span style={{ opacity: .55, fontSize: ".73rem", marginRight: 6 }}>({item.brand})</span>}
                  <span style={{
                    display: "inline-block", padding: "1px 8px", borderRadius: 10, fontSize: ".65rem", fontWeight: 700,
                    background: `${qLevel?.color}18`, color: qLevel?.color, border: `1px solid ${qLevel?.color}35`,
                  }}>{qLevel?.label || item.quantity}</span>
                  {item.notes && <span style={{ opacity: .4, fontSize: ".7rem", marginLeft: 6 }}>· {item.notes}</span>}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="del" style={{ color: "rgba(56,189,248,.4)" }} onClick={() => startEdit(realIdx)} title="Edit">✎</button>
                  <button className="del" onClick={() => del(realIdx)} title="Delete">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      );
    })}

    {rows.length === 0 && (
      <div className="card">
        <div className="empty">
          <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>📦</div>
          <div>Add your reef supplies above — food, salt mix, chemicals, and consumables.</div>
          <div style={{ marginTop: 10, fontSize: ".72rem", opacity: .6 }}>
            The AI will use your inventory to make smarter recommendations — suggesting what you have and alerting you when supplies run low.
          </div>
        </div>
      </div>
    )}
  </>;
}
