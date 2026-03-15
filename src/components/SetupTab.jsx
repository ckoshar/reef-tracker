import { useState, useEffect } from "react";
import DB from "../utils/db";

export default function SetupTab({ tank, setTank, onKeyChange }) {
  const [f, setF]         = useState(tank);
  const [apiKey, setApiKey] = useState(localStorage.getItem("reef_geminiKey") || "");
  const [saved, setSaved] = useState(false);

  // Load API key from cloud if available (overrides local)
  useEffect(() => {
    (async () => {
      const cloudKey = await DB.get("geminiKey");
      if (cloudKey) {
        setApiKey(cloudKey);
        localStorage.setItem("reef_geminiKey", cloudKey); // cache locally
      }
    })();
  }, []);

  const save = async () => {
    setTank(f);
    await DB.set("tank", f);
    if (apiKey.trim()) {
      localStorage.setItem("reef_geminiKey", apiKey.trim());
      await DB.set("geminiKey", apiKey.trim()); // sync to cloud too
    } else {
      localStorage.removeItem("reef_geminiKey");
      await DB.set("geminiKey", null);
    }
    onKeyChange();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const fields = [
    { k:"name",      l:"Tank Name",              ph:"My Reef Tank" },
    { k:"size",      l:"Tank Size",              ph:"20 gallon" },
    { k:"heater",    l:"Heater / Temp Control",  ph:"100W titanium + controller" },
    { k:"fish",      l:"Fish",                   ph:"2x Ocellaris Clownfish..." },
    { k:"inverts",   l:"Invertebrates",          ph:"5x Blue Leg Hermit Crabs..." },
    { k:"coral",     l:"Coral",                  ph:"Torch coral, Zoanthids..." },
    { k:"equipment", l:"Equipment",              ph:"Skimmer, return pump, powerheads..." },
    { k:"lighting",  l:"Lighting Setup",         ph:"AI Prime, 8hr photoperiod..." },
    { k:"notes",     l:"Notes",                  ph:"Anything else the AI should know..." },
  ];

  return <>
    <div className="sec-title">Tank Setup</div>

    <div className="card" style={{ borderColor: "rgba(6,182,212,.3)", background: "rgba(6,28,54,.6)" }}>
      <div className="card-title">🔑 Google Gemini API Key</div>
      <div style={{ fontSize: ".78rem", opacity: .65, marginBottom: 12, lineHeight: 1.6 }}>
        Required for AI Daily Reports, AI Chat, and Smart Fill features. Get a free key at <strong>aistudio.google.com</strong> → API Keys. Your key is stored only in your browser.
      </div>
      <div className="fg">
        <label className="fl">API Key</label>
        <input type="password" className="fi" placeholder="AIza..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
      </div>
    </div>

    <div className="card">
      <div className="card-title">Tank Profile</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map(({ k, l, ph }) => (
          <div className="fg" key={k}>
            <label className="fl">{l}</label>
            {k === "notes" || k === "coral" || k === "equipment"
              ? <textarea className="fi" placeholder={ph} value={f[k] || ""} onChange={e => setF({ ...f, [k]: e.target.value })} />
              : <input type="text" className="fi" placeholder={ph} value={f[k] || ""} onChange={e => setF({ ...f, [k]: e.target.value })} />
            }
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <button className="btn btn-green" onClick={save}>Save Everything</button>
        {saved && <span style={{ color: "#34d399", fontSize: ".78rem" }}>✓ Saved</span>}
      </div>
    </div>
  </>;
}
