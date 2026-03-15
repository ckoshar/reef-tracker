import { useRef } from "react";

export default function ChatTab({ chat, input, setInput, busy, onSend, endRef, image, setImage }) {
  const onKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } };
  const fileRef = useRef(null);
  const STARTERS = ["Is my alkalinity trend safe?","What corals suit my tank?","Why might pH drop at night?","Clownfish acting lethargic — causes?","Best feeding schedule for my fish?","How do I grow coralline faster?"];

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage({
        data: reader.result.split(",")[1], // base64 without prefix
        mimeType: file.type,
        preview: reader.result, // full data URL for preview
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return <>
    <div className="sec-title">AI Reef Advisor</div>
    <div className="card" style={{ padding: 0 }}>
      <div className="chat-wrap">
        <div className="chat-msgs">
          {chat.length === 0 && (
            <div className="empty" style={{ paddingTop: 50 }}>
              <div style={{ fontSize: "2rem", marginBottom: 10 }}>🪸</div>
              <div>Ask anything about your tank. I have full context of your parameters, maintenance history, feeding schedule, dosing, lighting, equipment, inventory, journal, and livestock profiles.</div>
              <div style={{ marginTop: 6, fontSize: ".74rem", opacity: .5 }}>📷 You can attach photos for the AI to analyze — algae, coral health, fish behavior, and more.</div>
              <div className="qs">
                {STARTERS.map(q => <button key={q} className="btn btn-ghost btn-sm" onClick={() => setInput(q)}>{q}</button>)}
              </div>
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={`cmsg ${m.role}`}>
              {m.image && (
                <img
                  src={m.image.preview}
                  alt="Attached"
                  style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, marginBottom: 8, display: "block" }}
                />
              )}
              {m.content}
            </div>
          ))}
          {busy && <div className="cmsg assistant pulse">Thinking...</div>}
          <div ref={endRef} />
        </div>

        {/* Image preview bar */}
        {image && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
            borderTop: "1px solid var(--border)", background: "rgba(6,182,212,.05)",
          }}>
            <img src={image.preview} alt="Preview" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".73rem", color: "#38bdf8" }}>📷 {image.name}</div>
              <div style={{ fontSize: ".65rem", opacity: .4 }}>Image attached — AI will analyze it</div>
            </div>
            <button className="del" onClick={removeImage} style={{ color: "#f43f5e" }}>✕</button>
          </div>
        )}

        <div className="chat-bar">
          <input type="file" accept="image/*" ref={fileRef} onChange={handleImageSelect} style={{ display: "none" }} />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fileRef.current?.click()}
            style={{ flexShrink: 0, padding: "8px 10px" }}
            title="Attach photo"
          >
            📷
          </button>
          <textarea className="chat-in" rows={2} placeholder="Ask about your tank… (Enter to send)"
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} />
          <button className="btn btn-green" onClick={onSend} disabled={busy || (!input.trim() && !image)}>Send</button>
        </div>
      </div>
    </div>
  </>;
}
