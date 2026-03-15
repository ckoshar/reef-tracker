import { useState, useMemo } from "react";
import DB from "../utils/db";
import { ai, extractMemories, cleanResponse } from "../utils/ai";
import { tod } from "../utils/helpers";

// ── Color-coded categories ──────────────────────────────────────────────
const CATEGORIES = {
  water_change: { label: "Water Change", color: "#38bdf8", icon: "💧" },
  testing:      { label: "Testing",      color: "#a78bfa", icon: "🧪" },
  cleaning:     { label: "Cleaning",     color: "#34d399", icon: "🧹" },
  feeding:      { label: "Feeding",      color: "#f97316", icon: "🐡" },
  livestock:    { label: "Livestock",     color: "#f43f5e", icon: "🐠" },
  dosing:       { label: "Dosing",       color: "#c084fc", icon: "💊" },
  equipment:    { label: "Equipment",    color: "#fbbf24", icon: "⚙️" },
  goal:         { label: "Goal/Plan",    color: "#06b6d4", icon: "🎯" },
  other:        { label: "Other",        color: "#94a3b8", icon: "📌" },
};

// ── Helpers ──────────────────────────────────────────────────────────────
const dayKey = (d) => d.toISOString().slice(0, 10);
const todayKey = dayKey(new Date());

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = daysInMonth(year, month);
  const days = [];
  for (let i = 0; i < first; i++) days.push(null);
  for (let d = 1; d <= total; d++) days.push(d);
  return days;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ── Build unified event list from all tank data ─────────────────────────
function buildEvents(maint, params, feed, dose, livestock, manualEvents, goals) {
  const events = [];

  // Maintenance events
  (maint || []).forEach(m => {
    let cat = "cleaning";
    if (m.task?.toLowerCase().includes("water change")) cat = "water_change";
    else if (m.task?.toLowerCase().includes("filter") || m.task?.toLowerCase().includes("media")) cat = "equipment";
    events.push({ date: m.date, title: m.task || "Maintenance", category: cat, source: "auto" });
  });

  // Parameter tests
  (params || []).forEach(p => {
    events.push({ date: p.date, title: "Parameter Test", category: "testing", source: "auto" });
  });

  // Feeding (only unique days with special notes)
  const feedDays = {};
  (feed || []).forEach(f => {
    if (!feedDays[f.date]) {
      feedDays[f.date] = true;
      events.push({ date: f.date, title: f.food || "Feeding", category: "feeding", source: "auto" });
    }
  });

  // Dosing
  const doseDays = {};
  (dose || []).forEach(d => {
    if (!doseDays[d.date]) {
      doseDays[d.date] = true;
      events.push({ date: d.date, title: d.name || "Dosing", category: "dosing", source: "auto" });
    }
  });

  // Livestock additions
  (livestock || []).forEach(l => {
    if (l.dateAdded) {
      events.push({ date: l.dateAdded, title: `Added: ${l.name || l.species}`, category: "livestock", source: "auto" });
    }
    (l.events || []).forEach(ev => {
      events.push({ date: ev.date, title: `${l.name}: ${ev.note}`, category: "livestock", source: "auto" });
    });
  });

  // Manual events
  (manualEvents || []).forEach(e => {
    events.push({ ...e, source: "manual" });
  });

  // Goal milestones
  (goals || []).forEach(g => {
    if (g.targetDate) {
      events.push({ date: g.targetDate, title: `🎯 Goal: ${g.title}`, category: "goal", source: "goal", goalId: g.id });
    }
    (g.milestones || []).forEach(ms => {
      if (ms.date) {
        events.push({ date: ms.date, title: ms.title, category: "goal", source: "goal", goalId: g.id, done: ms.done });
      }
    });
  });

  return events;
}

// ══ SCHEDULE TAB ════════════════════════════════════════════════════════
export default function ScheduleTab({ maint, params, feed, dose, livestock, getCtx, aiMemory, setAiMemory }) {
  const [view, setView] = useState("calendar"); // "calendar" | "timeline"
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [manualEvents, setManualEvents] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  // Add event form
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: todayKey, title: "", category: "other" });

  // Goal form
  const [showGoal, setShowGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [goalBusy, setGoalBusy] = useState(false);

  // Load manual events & goals from DB on mount
  useState(() => {
    (async () => {
      const me = await DB.get("scheduleEvents");
      const gl = await DB.get("scheduleGoals");
      if (me) setManualEvents(me);
      if (gl) setGoals(gl);
    })();
  });

  // Build all events
  const allEvents = useMemo(
    () => buildEvents(maint, params, feed, dose, livestock, manualEvents, goals),
    [maint, params, feed, dose, livestock, manualEvents, goals]
  );

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = {};
    allEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [allEvents]);

  // ── Save helpers ──
  const saveManualEvents = async (updated) => {
    setManualEvents(updated);
    await DB.set("scheduleEvents", updated);
  };

  const saveGoals = async (updated) => {
    setGoals(updated);
    await DB.set("scheduleGoals", updated);
  };

  // ── Add manual event ──
  const addEvent = async () => {
    if (!newEvent.title.trim()) return;
    const updated = [...manualEvents, { ...newEvent, id: Date.now().toString() }];
    await saveManualEvents(updated);
    setNewEvent({ date: todayKey, title: "", category: "other" });
    setShowAdd(false);
  };

  const deleteManualEvent = async (id) => {
    await saveManualEvents(manualEvents.filter(e => e.id !== id));
  };

  // ── AI Goal Planning ──
  const planGoal = async () => {
    if (!goalInput.trim() || goalBusy) return;
    setGoalBusy(true);
    const prompt = `The user has this reef tank goal: "${goalInput}"

Based on their current tank state, give:
1. An estimated date when they'll be ready (YYYY-MM-DD format)
2. A brief explanation of why that timeline
3. A step-by-step plan with specific milestone dates

IMPORTANT: Return your response in this exact JSON format (no markdown, no code fences):
{
  "title": "short goal title",
  "targetDate": "YYYY-MM-DD",
  "explanation": "why this timeline...",
  "milestones": [
    { "date": "YYYY-MM-DD", "title": "milestone description", "done": false }
  ]
}

Today is ${tod()}.`;

    try {
      const text = await ai(
        [{ role: "user", content: prompt }],
        `You are an expert reef aquarium planner. You have full context of the user's tank. Be realistic with timelines. Consider tank maturity, water parameters, existing livestock compatibility, and equipment. Return ONLY valid JSON.\n\n${getCtx()}`,
        1200
      );

      // Extract memories if any
      const memories = extractMemories(text);
      if (memories.length > 0 && setAiMemory) {
        const updated = [...(aiMemory || []), ...memories];
        setAiMemory(updated);
        await DB.set("aiMemory", updated);
      }

      const cleaned = cleanResponse(text);
      // Parse JSON from response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        const goal = { ...plan, id: Date.now().toString(), input: goalInput, createdDate: todayKey };
        await saveGoals([...goals, goal]);
        setGoalInput("");
        setShowGoal(false);
      } else {
        alert("AI returned an unexpected format. Try rephrasing your goal.");
      }
    } catch (e) {
      console.error("Goal planning failed:", e);
      alert("Failed to plan goal: " + (e.message || "API error"));
    }
    setGoalBusy(false);
  };

  const deleteGoal = async (id) => {
    await saveGoals(goals.filter(g => g.id !== id));
  };

  const toggleMilestone = async (goalId, msIdx) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      const ms = [...g.milestones];
      ms[msIdx] = { ...ms[msIdx], done: !ms[msIdx].done };
      return { ...g, milestones: ms };
    });
    await saveGoals(updated);
  };

  // ── Navigation ──
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  // ── Calendar Grid ──
  const calendarDays = getMonthDays(year, month);

  // ── Timeline events sorted ──
  const timelineEvents = useMemo(() => {
    return [...allEvents].sort((a, b) => b.date.localeCompare(a.date));
  }, [allEvents]);

  // Events for selected day
  const selectedEvents = selectedDay ? (eventsByDate[selectedDay] || []) : [];

  return <>
    <div className="sec-title">Schedule & Planner</div>

    {/* View toggle + actions */}
    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
      <button className={`btn ${view === "calendar" ? "btn-cyan" : "btn-ghost"} btn-sm`} onClick={() => setView("calendar")}>
        📅 Calendar
      </button>
      <button className={`btn ${view === "timeline" ? "btn-cyan" : "btn-ghost"} btn-sm`} onClick={() => setView("timeline")}>
        📋 Timeline
      </button>
      <div style={{ flex: 1 }} />
      <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(!showAdd)}>
        + Add Event
      </button>
      <button className="btn btn-ghost btn-sm" style={{ border: "1px solid rgba(6,182,212,.3)" }} onClick={() => setShowGoal(!showGoal)}>
        🎯 Plan Goal with AI
      </button>
    </div>

    {/* Add event form */}
    {showAdd && (
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Add Event</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="fg">
            <label className="fl">Date</label>
            <input type="date" className="fi" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
          </div>
          <div className="fg">
            <label className="fl">Title</label>
            <input type="text" className="fi" placeholder="e.g. Buy new coral, Deep clean..." value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
          </div>
          <div className="fg">
            <label className="fl">Category</label>
            <select className="fi" value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-green btn-sm" onClick={addEvent}>Save Event</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      </div>
    )}

    {/* AI Goal planner */}
    {showGoal && (
      <div className="card" style={{ marginBottom: 16, borderColor: "rgba(6,182,212,.3)" }}>
        <div className="card-title">🎯 AI Goal Planner</div>
        <div style={{ fontSize: ".78rem", opacity: .65, marginBottom: 12, lineHeight: 1.6 }}>
          Describe what you want to accomplish and AI will estimate a timeline and create milestones for your calendar.
        </div>
        <div className="fg">
          <label className="fl">Your Goal</label>
          <textarea className="fi" placeholder="e.g. I want to add a Yellow Tang but my tank might be too small long-term. When should I upgrade and what do I need to prepare?" value={goalInput} onChange={e => setGoalInput(e.target.value)} rows={3} />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="btn btn-cyan btn-sm" onClick={planGoal} disabled={goalBusy}>
            {goalBusy ? "Planning..." : "✨ Generate Plan"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowGoal(false)}>Cancel</button>
        </div>
      </div>
    )}

    {/* ── CALENDAR VIEW ── */}
    {view === "calendar" && (
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={prevMonth}>◀</button>
          <div style={{ fontFamily: "Cinzel,serif", fontSize: "1.1rem", fontWeight: 600 }}>
            {MONTHS[month]} {year}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={nextMonth}>▶</button>
        </div>

        {/* Day of week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center", marginBottom: 6 }}>
          {DOW.map(d => (
            <div key={d} style={{ fontSize: ".7rem", opacity: .5, fontWeight: 600 }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dk = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = eventsByDate[dk] || [];
            const isToday = dk === todayKey;
            const isSelected = dk === selectedDay;
            // Get unique category colors for dots
            const cats = [...new Set(dayEvents.map(e => e.category))];

            return (
              <div
                key={dk}
                onClick={() => setSelectedDay(isSelected ? null : dk)}
                style={{
                  minHeight: 48,
                  padding: "4px 2px",
                  borderRadius: 6,
                  cursor: "pointer",
                  textAlign: "center",
                  border: isSelected ? "1px solid #06b6d4" : isToday ? "1px solid rgba(6,182,212,.4)" : "1px solid transparent",
                  background: isSelected ? "rgba(6,182,212,.12)" : isToday ? "rgba(6,182,212,.06)" : "transparent",
                  transition: "all .15s",
                }}
              >
                <div style={{ fontSize: ".8rem", fontWeight: isToday ? 700 : 400, color: isToday ? "#06b6d4" : "inherit" }}>
                  {day}
                </div>
                {cats.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2, flexWrap: "wrap" }}>
                    {cats.slice(0, 4).map(cat => (
                      <div key={cat} style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: CATEGORIES[cat]?.color || "#94a3b8",
                      }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.06)" }}>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".7rem", opacity: .7 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.color }} />
              {v.label}
            </div>
          ))}
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize: ".85rem", fontWeight: 600, marginBottom: 8 }}>
              {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
            {selectedEvents.length === 0 ? (
              <div style={{ fontSize: ".78rem", opacity: .5 }}>No events this day</div>
            ) : (
              selectedEvents.map((ev, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORIES[ev.category]?.color || "#94a3b8", flexShrink: 0 }} />
                  <span style={{ fontSize: ".8rem", flex: 1, textDecoration: ev.done ? "line-through" : "none", opacity: ev.done ? .5 : 1 }}>{ev.title}</span>
                  <span style={{ fontSize: ".65rem", opacity: .4 }}>{CATEGORIES[ev.category]?.label}</span>
                  {ev.source === "manual" && (
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: ".65rem", padding: "2px 6px" }} onClick={() => deleteManualEvent(ev.id)}>✕</button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )}

    {/* ── TIMELINE VIEW ── */}
    {view === "timeline" && (
      <div className="card">
        <div className="card-title">Event Timeline</div>
        {timelineEvents.length === 0 ? (
          <div style={{ fontSize: ".8rem", opacity: .5, padding: 16, textAlign: "center" }}>
            No events yet. Start logging data or add events manually.
          </div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {(() => {
              let lastDate = "";
              return timelineEvents.map((ev, i) => {
                const showDateHeader = ev.date !== lastDate;
                lastDate = ev.date;
                const isToday = ev.date === todayKey;
                const isFuture = ev.date > todayKey;
                return (
                  <div key={i}>
                    {showDateHeader && (
                      <div style={{
                        fontSize: ".75rem", fontWeight: 600, padding: "10px 0 4px",
                        color: isToday ? "#06b6d4" : isFuture ? "#34d399" : "rgba(255,255,255,.5)",
                        borderTop: i > 0 ? "1px solid rgba(255,255,255,.06)" : "none",
                      }}>
                        {isToday ? "Today" : isFuture ? "Upcoming" : ""} — {new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0 5px 12px" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: CATEGORIES[ev.category]?.color || "#94a3b8", flexShrink: 0 }} />
                      <span style={{ fontSize: ".8rem", flex: 1, textDecoration: ev.done ? "line-through" : "none", opacity: ev.done ? .5 : 1 }}>
                        {CATEGORIES[ev.category]?.icon} {ev.title}
                      </span>
                      {ev.source === "manual" && (
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: ".65rem", padding: "2px 6px" }} onClick={() => deleteManualEvent(ev.id)}>✕</button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    )}

    {/* ── GOALS SECTION ── */}
    {goals.length > 0 && (
      <>
        <div className="sec-title" style={{ marginTop: 20 }}>Active Goals</div>
        {goals.map(g => (
          <div key={g.id} className="card" style={{ borderColor: "rgba(6,182,212,.2)", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: ".9rem" }}>🎯 {g.title}</div>
                <div style={{ fontSize: ".75rem", opacity: .5, marginTop: 2 }}>
                  Target: {new Date(g.targetDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: ".65rem" }} onClick={() => deleteGoal(g.id)}>✕ Remove</button>
            </div>
            {g.explanation && (
              <div style={{ fontSize: ".78rem", opacity: .7, marginTop: 8, lineHeight: 1.5, padding: "8px 10px", background: "rgba(6,182,212,.06)", borderRadius: 6 }}>
                {g.explanation}
              </div>
            )}
            {g.milestones?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: ".75rem", fontWeight: 600, opacity: .6, marginBottom: 6 }}>Milestones</div>
                {g.milestones.map((ms, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.04)", cursor: "pointer" }}
                    onClick={() => toggleMilestone(g.id, idx)}
                  >
                    <span style={{ fontSize: ".85rem" }}>{ms.done ? "✅" : "⬜"}</span>
                    <span style={{ fontSize: ".8rem", flex: 1, textDecoration: ms.done ? "line-through" : "none", opacity: ms.done ? .5 : 1 }}>
                      {ms.title}
                    </span>
                    <span style={{ fontSize: ".65rem", opacity: .4 }}>
                      {new Date(ms.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </>
    )}
  </>;
}
