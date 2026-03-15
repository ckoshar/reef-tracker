import { TASKS, QUANTITY_LEVELS } from "./constants";
import { tod, daysAgo, fmtTime } from "./helpers";

// ── AI helper (Google Gemini — supports text + images) ────────────────────
export async function ai(messages, system, tokens = 1200) {
  // Try localStorage first (fast), it gets kept in sync with cloud by SetupTab
  const apiKey = localStorage.getItem("reef_geminiKey") || "";
  if (!apiKey) return "⚠️ No API key found. Please add your Google Gemini API key in the Setup tab to use AI features.";
  try {
    // Build Gemini contents from messages (supports multimodal)
    const contents = messages.map(m => {
      const parts = [];
      if (m.content) parts.push({ text: m.content });
      if (m.image?.data) {
        parts.push({
          inline_data: {
            mime_type: m.image.mimeType || "image/jpeg",
            data: m.image.data,
          },
        });
      }
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts,
      };
    });

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { maxOutputTokens: tokens },
        }),
      }
    );
    const d = await r.json();
    if (d.error) return `API Error: ${d.error.message}`;
    return d.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
  } catch (e) {
    return `Connection error: ${e.message}`;
  }
}

// ── AI Smart Fill helper ──────────────────────────────────────────────────
export async function smartFill(type, ctx) {
  const prompts = {
    feed: `Based on the tank data below, suggest what to feed today. Return ONLY valid JSON like: {"food":"Pellets","amount":"small pinch","notes":"reason for suggestion"}. Pick from: Pellets, Flake, Frozen Mysis, Frozen Brine, Live Brine, Copepods, Coral Food, NLS Thera A, Other. Consider recent feeding history to vary the diet, livestock needs, and available inventory.\n\n${ctx}`,
    dose: `Based on the tank data below, suggest a dosing entry for today. Return ONLY valid JSON like: {"product":"Two Part A","amount":"10ml","notes":"reason for suggestion"}. Pick from: Two Part A, Two Part B, Calcium, Alkalinity, Magnesium, Iodide, Strontium, Reef Energy, Bacteria/Probiotic, Other. Consider recent parameters, dosing history, and available inventory.\n\n${ctx}`,
    maint: `Based on the tank data below, suggest the most important maintenance task to do today. Return ONLY valid JSON like: {"task":"glass","notes":"reason this is most urgent"}. Task IDs: glass, wchange, ato, skimmer, return, phead, filter, sump, saltmix, lights, equip, coral. Pick the most overdue or most important one.\n\n${ctx}`,
  };

  const result = await ai(
    [{ role: "user", content: prompts[type] }],
    "You are a reef tank advisor. Respond with ONLY the JSON object requested, no other text. Consider the user's current inventory when making suggestions - recommend items they already have in stock, and note when supplies are running low.",
    300
  );

  try {
    const cleaned = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ── Memory extraction from AI responses ───────────────────────────────────
export function extractMemories(text) {
  const memories = [];
  const regex = /\[MEMORY:\s*(.+?)\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    memories.push({
      date: tod(),
      fact: match[1].trim(),
      source: "chat",
    });
  }
  return memories;
}

// ── Clean AI response (remove memory tags from displayed text) ────────────
export function cleanResponse(text) {
  return text.replace(/\[MEMORY:\s*.+?\]/g, "").trim();
}

// ── Context Builder ───────────────────────────────────────────────────────
export function buildCtx(tank, params, feed, maint, dose, light, equip, inventory = [], journal = [], livestock = [], aiMemory = []) {
  const taskStatus = TASKS.map(t => {
    const last = [...maint].filter(l => l.task === t.id).pop();
    const days = last ? daysAgo(last.date) : null;
    return `${t.label}: ${last ? `last done ${last.date} (${days}d ago, rec every ${t.every}d)${days > t.every ? " — OVERDUE" : ""}` : "NEVER LOGGED"}`;
  });

  const inventorySection = inventory.length > 0
    ? `\nCURRENT INVENTORY/SUPPLIES:\n${inventory.map(item => {
        const qLevel = QUANTITY_LEVELS.find(q => q.value === item.quantity);
        return `- [${item.category.toUpperCase()}] ${item.name}${item.brand ? ` (${item.brand})` : ""}: ${qLevel ? qLevel.label : item.quantity}${item.notes ? ` — ${item.notes}` : ""}`;
      }).join("\n")}\n`
    : "\nINVENTORY: No supplies tracked yet.\n";

  const journalSection = journal.length > 0
    ? `\nRECENT JOURNAL ENTRIES (last 7):\n${[...journal].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map(j => `[${j.date}] ${j.content}`).join("\n")}\n`
    : "";

  const livestockSection = livestock.length > 0
    ? `\nLIVESTOCK PROFILES:\n${livestock.map(a => {
        const lastEvent = a.history?.[a.history.length - 1];
        return `- [${a.type.toUpperCase()}] ${a.name} (${a.species}) — Status: ${a.status}${a.placement ? `, Placement: ${a.placement}` : ""}${lastEvent ? `, Last note [${lastEvent.date}]: ${lastEvent.note}` : ""}`;
      }).join("\n")}\n`
    : "";

  const memorySection = aiMemory.length > 0
    ? `\nAI MEMORY (learned facts about this user):\n${aiMemory.slice(-30).map(m => `- [${m.date}] ${m.fact}`).join("\n")}\n`
    : "";

  const paramLines = params.slice(-8).map(p => {
    const timeStr = p.time ? ` ${fmtTime(p.time)}` : "";
    const ctxStr = p.context?.length ? ` (${p.context.join(", ")})` : "";
    const vals = [];
    if (p.temp) vals.push(`Temp:${p.temp}`);
    if (p.salinity) vals.push(`Sal:${p.salinity}`);
    if (p.ph) vals.push(`pH:${p.ph}`);
    if (p.ammonia) vals.push(`NH3:${p.ammonia}`);
    if (p.nitrite) vals.push(`NO2:${p.nitrite}`);
    if (p.nitrate) vals.push(`NO3:${p.nitrate}`);
    if (p.calcium) vals.push(`Ca:${p.calcium}`);
    if (p.alk) vals.push(`Alk:${p.alk}`);
    if (p.mag) vals.push(`Mg:${p.mag}`);
    return `[${p.date}${timeStr}${ctxStr}] ${vals.join(" ")}`;
  }).join("\n") || "No test data yet.";

  return `
REEF TANK: ${tank.name} (${tank.size})
HEATER: ${tank.heater}
FISH: ${tank.fish}
INVERTEBRATES: ${tank.inverts}
CORAL: ${tank.coral}
EQUIPMENT: ${tank.equipment}
LIGHTING: ${tank.lighting || "not specified"}
NOTES: ${tank.notes}
${inventorySection}${livestockSection}${journalSection}${memorySection}
RECENT WATER TESTS (last 8):
${paramLines}

MAINTENANCE STATUS:
${taskStatus.join("\n")}

RECENT FEEDINGS (last 10):
${feed.slice(-10).map(f => `[${f.date}] ${f.food}${f.amount ? " — " + f.amount : ""}${f.notes ? " (" + f.notes + ")" : ""}`).join("\n") || "No feeding data yet."}

RECENT DOSING (last 10):
${dose.slice(-10).map(d => `[${d.date}] ${d.product}: ${d.amount}${d.notes ? " (" + d.notes + ")" : ""}`).join("\n") || "No dosing data yet."}

RECENT LIGHTING NOTES (last 5):
${light.slice(-5).map(l => `[${l.date}] ${l.type}: ${l.notes || ""}`).join("\n") || "No lighting notes yet."}

RECENT EQUIPMENT NOTES (last 5):
${equip.slice(-5).map(e => `[${e.date}] ${e.item}: ${e.notes || ""}`).join("\n") || "No equipment notes yet."}
`.trim();
}
