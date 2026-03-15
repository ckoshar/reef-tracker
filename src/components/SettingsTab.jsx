import { useState } from "react";
import DB from "../utils/db";
import { fmt } from "../utils/helpers";

const TOGGLES = [
  { key: "params",    label: "🧪 Water Parameters", desc: "Log and chart water test results" },
  { key: "feed",      label: "🐡 Feeding",          desc: "Track feeding schedule and types" },
  { key: "maint",     label: "🔧 Maintenance",      desc: "Maintenance task tracker with due dates" },
  { key: "dose",      label: "💊 Dosing",            desc: "Log supplement and additive dosing" },
  { key: "light",     label: "💡 Lighting",          desc: "Track lighting events and changes" },
  { key: "equip",     label: "⚙️ Equipment",         desc: "Log equipment checks and status" },
  { key: "inventory", label: "📦 Inventory",         desc: "Track supplies, food, salt mix, chemicals" },
  { key: "journal",   label: "📝 Journal",           desc: "Daily free-form notes and observations" },
  { key: "livestock", label: "🐠 Livestock",         desc: "Individual fish, coral, and invert profiles" },
  { key: "schedule",  label: "📅 Schedule",          desc: "Calendar view with AI goal planning" },
  { key: "chat",      label: "💬 AI Chat",           desc: "Chat with the AI reef advisor" },
];

export default function SettingsTab({ settings, setSettings, aiMemory, setAiMemory }) {
  const [memoryExpanded, setMemoryExpanded] = useState(false);

  const toggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await DB.set("settings", updated);
  };

  const deleteMemory = async (index) => {
    const updated = aiMemory.filter((_, i) => i !== index);
    setAiMemory(updated);
    await DB.set("aiMemory", updated);
  };

  const clearAllMemories = async () => {
    setAiMemory([]);
    await DB.set("aiMemory", []);
  };

  return <>
    <div className="sec-title">Settings</div>
    <div className="card">
      <div className="card-title">Toggle Features</div>
      <div style={{ fontSize: ".78rem", opacity: .55, marginBottom: 16, lineHeight: 1.6 }}>
        Show or hide tabs to customize your dashboard. Dashboard, Setup, and Settings are always visible.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {TOGGLES.map(t => (
          <div
            key={t.key}
            onClick={() => toggle(t.key)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 10, cursor: "pointer",
              background: settings[t.key] ? "rgba(6,182,212,.08)" : "rgba(3,12,24,.4)",
              border: `1px solid ${settings[t.key] ? "rgba(6,182,212,.25)" : "rgba(148,163,184,.12)"}`,
              transition: "all .2s",
            }}
          >
            <div>
              <div style={{ fontSize: ".85rem", fontWeight: 600, color: settings[t.key] ? "#38bdf8" : "rgba(200,230,245,.4)", marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: ".7rem", opacity: .5 }}>{t.desc}</div>
            </div>
            <div style={{
              width: 44, height: 24, borderRadius: 12, padding: 2,
              background: settings[t.key] ? "linear-gradient(135deg,#0284c7,#06b6d4)" : "rgba(148,163,184,.2)",
              transition: "all .25s", cursor: "pointer", flexShrink: 0,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 10, background: "#fff",
                transform: settings[t.key] ? "translateX(20px)" : "translateX(0)",
                transition: "transform .25s", boxShadow: "0 1px 3px rgba(0,0,0,.3)",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* AI Memory Management */}
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>🧠 AI Memory ({aiMemory.length} facts)</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setMemoryExpanded(!memoryExpanded)}>
          {memoryExpanded ? "Collapse" : "Expand"}
        </button>
      </div>
      <div style={{ fontSize: ".76rem", opacity: .5, marginBottom: 12, lineHeight: 1.6 }}>
        The AI learns facts about you and your tank during conversations. These memories persist across sessions so the AI gets smarter over time.
      </div>
      {memoryExpanded && (
        <>
          {aiMemory.length === 0 ? (
            <div style={{ fontSize: ".78rem", opacity: .35, textAlign: "center", padding: 16 }}>
              No memories yet. Chat with the AI and it will start learning about your tank habits and preferences.
            </div>
          ) : (
            <>
              {aiMemory.map((m, i) => (
                <div className="entry" key={i} style={{ borderLeftColor: "rgba(192,132,252,.3)" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: ".68rem", opacity: .4, marginRight: 8 }}>{fmt(m.date)}</span>
                    <span style={{ fontSize: ".78rem" }}>{m.fact}</span>
                  </div>
                  <button className="del" onClick={() => deleteMemory(i)} title="Delete this memory">✕</button>
                </div>
              ))}
              <button className="btn btn-red btn-sm" style={{ marginTop: 10 }} onClick={clearAllMemories}>Clear All Memories</button>
            </>
          )}
        </>
      )}
    </div>

    <div className="card" style={{ marginTop: 14 }}>
      <div className="card-title">About</div>
      <div style={{ fontSize: ".78rem", opacity: .55, lineHeight: 1.7 }}>
        <strong style={{ color: "var(--teal)" }}>Reef Tracker</strong> — Your personal reef aquarium management dashboard.
        <br />AI features powered by Google Gemini. All data stored locally in your browser.
      </div>
    </div>
  </>;
}
