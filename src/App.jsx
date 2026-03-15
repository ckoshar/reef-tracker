import { useState, useEffect, useRef } from "react";
import { DEFAULT_TANK, DEFAULT_SETTINGS } from "./utils/constants";
import { tod } from "./utils/helpers";
import DB from "./utils/db";
import { ai, buildCtx, extractMemories, cleanResponse } from "./utils/ai";
import { auth, googleProvider } from "./utils/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import "./styles/app.css";

// ── Components ────────────────────────────────────────────────────────────
import DashTab from "./components/DashTab";
import ParamsTab from "./components/ParamsTab";
import FeedTab from "./components/FeedTab";
import MaintTab from "./components/MaintTab";
import DoseTab from "./components/DoseTab";
import LightTab from "./components/LightTab";
import EquipTab from "./components/EquipTab";
import ChatTab from "./components/ChatTab";
import SetupTab from "./components/SetupTab";
import SettingsTab from "./components/SettingsTab";
import InventoryTab from "./components/InventoryTab";
import JournalTab from "./components/JournalTab";
import LivestockTab from "./components/LivestockTab";
import ScheduleTab from "./components/ScheduleTab";

// ── Font Loading ──────────────────────────────────────────────────────────
(() => {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap";
  document.head.appendChild(l);
})();

// ══ APP ═══════════════════════════════════════════════════════════════════
export default function ReefTracker() {
  const [tab, setTab]             = useState("dash");
  const [ready, setReady]         = useState(false);
  const [tank, setTank]           = useState(DEFAULT_TANK);
  const [params, setParams]       = useState([]);
  const [feed, setFeed]           = useState([]);
  const [maint, setMaint]         = useState([]);
  const [dose, setDose]           = useState([]);
  const [light, setLight]         = useState([]);
  const [equip, setEquip]         = useState([]);
  const [inventory, setInventory] = useState([]);
  const [journal, setJournal]     = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [aiMemory, setAiMemory]   = useState([]);
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS);
  const [report, setReport]       = useState(null);
  const [repBusy, setRepBusy]     = useState(false);
  const [chat, setChat]           = useState([]);
  const [chatIn, setChatIn]       = useState("");
  const [chatImage, setChatImage] = useState(null);
  const [chatBusy, setChatBusy]   = useState(false);
  const [hasKey, setHasKey]       = useState(false);
  const [user, setUser]           = useState(null);    // Firebase auth user
  const [authReady, setAuthReady] = useState(false);   // true once auth state is known
  const chatEnd = useRef(null);

  // ── Load all data from DB (called after auth is resolved) ──
  const loadAllData = async () => {
    const [tk, pm, fd, mn, do_, li, eq, rp, inv, st, jn, ls, mem] = await Promise.all([
      DB.get("tank"), DB.get("params"), DB.get("feed"), DB.get("maint"),
      DB.get("dose"), DB.get("light"), DB.get("equip"), DB.get("report"),
      DB.get("inventory"), DB.get("settings"), DB.get("journal"),
      DB.get("livestock"), DB.get("aiMemory"),
    ]);
    if (tk) setTank(tk); if (pm) setParams(pm); if (fd) setFeed(fd);
    if (mn) setMaint(mn); if (do_) setDose(do_); if (li) setLight(li);
    if (eq) setEquip(eq); if (rp) setReport(rp); if (inv) setInventory(inv);
    if (st) setSettings({ ...DEFAULT_SETTINGS, ...st });
    if (jn) setJournal(jn); if (ls) setLivestock(ls); if (mem) setAiMemory(mem);
    // Check for Gemini key (cloud or local)
    const cloudKey = await DB.get("geminiKey");
    setHasKey(!!(cloudKey || localStorage.getItem("reef_geminiKey")));
  };

  // ── Firebase Auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        DB.setUser(firebaseUser.uid);
        setUser(firebaseUser);
      } else {
        DB.setUser(null);
        setUser(null);
      }
      await loadAllData();
      setAuthReady(true);
      setReady(true);
    });
    return unsub;
  }, []);

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      DB.setUser(result.user.uid);
      // Migrate localStorage data to cloud on first sign-in
      await DB.migrateToCloud();
      // Reload data from cloud
      await loadAllData();
    } catch (e) {
      console.error("Sign-in failed:", e);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    DB.setUser(null);
    setUser(null);
  };

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const ctx = () => buildCtx(tank, params, feed, maint, dose, light, equip, inventory, journal, livestock, aiMemory);

  const MEMORY_PROMPT = `\n\nIMPORTANT: If you learn a new fact about the user, their preferences, their tank, their schedule, or anything useful for future advice, include it as [MEMORY: fact here] at the end of your response. If you're unsure about something or notice missing information, ask the user a clarifying question. Examples of good memories: test kit brands, schedule preferences, goals, past problems, livestock behavior patterns.`;

  const genReport = async () => {
    setRepBusy(true);
    const text = await ai(
      [{ role: "user", content: `Today is ${tod()}. Generate my daily reef tank report.` }],
      `You are an expert reef aquarium advisor. Generate a concise DAILY REPORT with these sections:

🔴 URGENT — anything overdue >50% past interval, or concerning parameter trends. Say "All clear." if none.
📋 TODAY'S TO-DO — list specific tasks due or overdue with days overdue.
📊 PARAMETER TRENDS — brief analysis of recent tests. Note time-of-day patterns if available.
🐠 LIVESTOCK — health status of individual animals, feeding notes, behavior concerns.
📦 INVENTORY ALERTS — flag any supplies that are low or empty and need restocking.
📝 JOURNAL NOTES — reference any relevant recent journal observations.
💡 TIP — one specific actionable tip for their current tank stage.

Be specific. Use their actual data. Reference individual livestock by name. If a task has NEVER been logged, mention it. When making recommendations, reference items from their inventory. Today is ${tod()}.

${ctx()}`,
      1600
    );
    const memories = extractMemories(text);
    if (memories.length > 0) {
      const updated = [...aiMemory, ...memories];
      setAiMemory(updated);
      await DB.set("aiMemory", updated);
    }
    const cleaned = cleanResponse(text);
    setReport(cleaned);
    await DB.set("report", cleaned);
    setRepBusy(false);
  };

  const sendChat = async () => {
    if ((!chatIn.trim() && !chatImage) || chatBusy) return;
    const msg = chatIn.trim();
    setChatIn("");
    const userMsg = { role: "user", content: msg || "(image attached)" };
    if (chatImage) userMsg.image = chatImage;
    setChatImage(null);
    const msgs = [...chat, userMsg];
    setChat(msgs);
    setChatBusy(true);
    const reply = await ai(
      msgs,
      `You are an expert reef aquarium advisor with full context of the user's tank. Give specific, practical advice tailored to their exact setup. Reference individual livestock by name when relevant. When recommending products or food, check their inventory first — suggest what they have in stock, and note if something is running low or needs to be purchased. If the user attaches a photo, analyze it carefully for coral health, algae identification, fish disease, equipment issues, etc. Be conversational but precise. Today is ${tod()}.${MEMORY_PROMPT}\n\n${ctx()}`
    );
    // Extract and save memories
    const memories = extractMemories(reply);
    if (memories.length > 0) {
      const updated = [...aiMemory, ...memories];
      setAiMemory(updated);
      await DB.set("aiMemory", updated);
    }
    const cleaned = cleanResponse(reply);
    setChat([...msgs, { role: "assistant", content: cleaned }]);
    setChatBusy(false);
  };

  if (!ready) return (
    <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div className="pulse glow" style={{ fontFamily: "Cinzel,serif", fontSize: "1rem" }}>Loading your reef...</div>
    </div>
  );

  const ALL_TABS = [
    { id: "dash",      label: "📊 Dashboard",   always: true },
    { id: "params",    label: "🧪 Parameters",  always: false },
    { id: "feed",      label: "🐡 Feeding",     always: false },
    { id: "maint",     label: "🔧 Maintenance", always: false },
    { id: "dose",      label: "💊 Dosing",       always: false },
    { id: "light",     label: "💡 Lighting",     always: false },
    { id: "equip",     label: "⚙️ Equipment",    always: false },
    { id: "inventory", label: "📦 Inventory",    always: false },
    { id: "journal",   label: "📝 Journal",      always: false },
    { id: "livestock", label: "🐠 Livestock",    always: false },
    { id: "schedule",  label: "📅 Schedule",     always: false },
    { id: "chat",      label: "💬 AI Chat",      always: false },
    { id: "setup",     label: "🪸 Setup",        always: true },
    { id: "settings",  label: "🛠️ Settings",     always: true },
  ];

  const visibleTabs = ALL_TABS.filter(t => t.always || settings[t.id]);

  return (
    <div className="app">
      <div className="hdr">
        <div className="hdr-top">
          <div>
            <div className="hdr-title">🪸 {tank.name}</div>
            <div className="hdr-sub">{tank.size} · {tank.fish.split(",").length} fish · {tank.inverts.split(",").length} inverts</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user ? (
              <>
                <span style={{ fontSize: ".72rem", opacity: .6 }}>☁️ {user.displayName?.split(" ")[0] || user.email}</span>
                <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>Sign Out</button>
              </>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={handleSignIn} style={{ border: "1px solid rgba(6,182,212,.3)" }}>
                ☁️ Sign In to Sync
              </button>
            )}
          </div>
        </div>
        <div className="tabs">
          {visibleTabs.map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="content">
        {!hasKey && tab !== "setup" && (
          <div className="api-banner">
            ⚠️ Add your Google Gemini API key in the <button className="btn btn-ghost btn-sm" style={{marginLeft:4}} onClick={() => setTab("setup")}>🪸 Setup tab</button> to enable AI features.
          </div>
        )}
        {tab === "dash"      && <DashTab params={params} maint={maint} feed={feed} report={report} busy={repBusy} onGen={genReport} />}
        {tab === "params"    && <ParamsTab rows={params} setRows={setParams} />}
        {tab === "feed"      && <FeedTab rows={feed} setRows={setFeed} getCtx={ctx} />}
        {tab === "maint"     && <MaintTab rows={maint} setRows={setMaint} getCtx={ctx} />}
        {tab === "dose"      && <DoseTab rows={dose} setRows={setDose} getCtx={ctx} />}
        {tab === "light"     && <LightTab rows={light} setRows={setLight} />}
        {tab === "equip"     && <EquipTab rows={equip} setRows={setEquip} />}
        {tab === "inventory" && <InventoryTab rows={inventory} setRows={setInventory} />}
        {tab === "journal"   && <JournalTab rows={journal} setRows={setJournal} />}
        {tab === "livestock" && <LivestockTab rows={livestock} setRows={setLivestock} />}
        {tab === "schedule"  && <ScheduleTab maint={maint} params={params} feed={feed} dose={dose} livestock={livestock} getCtx={ctx} aiMemory={aiMemory} setAiMemory={setAiMemory} />}
        {tab === "chat"      && <ChatTab chat={chat} input={chatIn} setInput={setChatIn} busy={chatBusy} onSend={sendChat} endRef={chatEnd} image={chatImage} setImage={setChatImage} />}
        {tab === "setup"     && <SetupTab tank={tank} setTank={setTank} onKeyChange={() => setHasKey(!!localStorage.getItem("reef_geminiKey"))} />}
        {tab === "settings"  && <SettingsTab settings={settings} setSettings={setSettings} aiMemory={aiMemory} setAiMemory={setAiMemory} />}
      </div>
    </div>
  );
}
