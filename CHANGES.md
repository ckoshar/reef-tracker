# Reef Tracking App — Planned Changes

**Codebase:** `/Users/carterkoshar/reef-tracker` (React + Vite, refactored into components)
**Stack:** React 19, Recharts, Vite 8, localStorage for data, Google Gemini API for AI
**Current Tabs:** Dashboard, Parameters, Feeding, Maintenance, Dosing, Lighting, Equipment, Inventory, AI Chat, Setup, Settings

---

## Feature 1: Settings Page (Toggle Features On/Off)

Add a new "⚙️ Settings" tab that lets you show/hide tabs and dashboard sections.

### What it needs (code-specific):
- Add a new `SettingsTab` component in `App.jsx`
- Add `["settings","⚙️ Settings"]` to the `TABS` array (line ~296)
- Create toggle switches for each existing tab:
  - 🧪 Parameters
  - 🐡 Feeding
  - 🔧 Maintenance
  - 💊 Dosing
  - 💡 Lighting
  - ⚙️ Equipment
  - 💬 AI Chat
  - 📦 Inventory (new, from Feature 4)
- Store toggle state in localStorage via the existing `DB` helper (e.g., `reef_settings`)
- Add a new `settings` state in `ReefTracker()` component
- Filter the `TABS` array rendering (line ~312) based on settings
- Dashboard, Setup, and Settings tabs should always be visible (can't disable them)
- Each toggle should be a clean on/off switch matching the app's teal/dark theme

### Why:
Not every user needs every tab. This keeps the interface clean and personalized.

---

## Feature 2: AI Auto-Update for Inputs

Add a "✨ Smart Fill" button on the Feeding, Dosing, and Maintenance tabs that uses the AI to pre-populate forms based on past patterns.

### What it needs (code-specific):
- Add a "✨ Smart Fill" button to `FeedTab`, `DoseTab`, and `MaintTab` components
- When clicked, call the existing `ai()` helper function (line ~157) with the user's history from `buildCtx()`
- AI should analyze past entries and return suggested values:
  - **Feeding:** suggest food type, amount, based on recent feeding patterns
  - **Dosing:** suggest product and amount based on recent dosing and latest water parameters
  - **Maintenance:** suggest which task to log based on what's overdue (already calculated in `MaintTab`)
- Pre-fill the form fields with AI suggestions — user reviews and clicks Save as normal
- Show a small "🤖 AI suggested" indicator on auto-filled fields
- Add a loading state while AI is thinking
- This uses the same Anthropic API (or Gemini after Feature 3) already in the app

### Why:
Saves time on repetitive logging. The AI already has full tank context via `buildCtx()` — this just uses it proactively.

---

## Feature 3: Switch AI from Anthropic API to Google Gemini API

Replace the `ai()` function (line ~157) to call Google Gemini instead of Anthropic Claude.

### What it needs (code-specific):
- Update the `ai()` function to call `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent` instead of `https://api.anthropic.com/v1/messages`
- Change request format from Anthropic's `{ model, max_tokens, system, messages }` to Gemini's `{ contents, systemInstruction, generationConfig }`
- Change response parsing from `d.content?.find(b => b.type === "text")?.text` to Gemini's format `d.candidates[0].content.parts[0].text`
- Update the `SetupTab` component:
  - Change "Anthropic API Key" label to "Google Gemini API Key"
  - Change placeholder from `sk-ant-...` to `AIza...`
  - Update the help text to point to Google AI Studio instead of console.anthropic.com
- Update `localStorage` key from `reef_apiKey` to `reef_geminiKey` (or keep same key, just update labels)
- Remove the `anthropic-dangerous-direct-browser-access` and `anthropic-version` headers
- Update the API banner text (line ~321) to mention Google Gemini instead of Anthropic
- Test: Daily Report generation, AI Chat, and Smart Fill (Feature 2) all work with Gemini

### Why:
Switching to Gemini for cost, availability, or preference. All AI features work the same — just a different model behind them.

---

## Feature 4: Supply Inventory Tracker

Add a new "📦 Inventory" tab where you can track what supplies you currently have on hand, so the AI can give recommendations based on your actual stock.

### What it needs (code-specific):
- Add a new `InventoryTab` component in `App.jsx`
- Add `["inventory","📦 Inventory"]` to the `TABS` array
- Add `inventory` state and `setInventory` in `ReefTracker()`, loaded from `DB.get("inventory")`
- Supply categories with add/edit/delete:
  - **Food** — items from the existing `FOODS` array (line ~129) plus brand, quantity level
  - **Salt Mix** — brand, type, amount remaining
  - **Chemicals & Additives** — items from the existing `DOSES` array (line ~130) plus brand, bottle size, amount left
  - **Equipment/Consumables** — filter media, test kit reagents, replacement parts
- Simple quantity tracking: Full / 3/4 / Half / Low / Empty (or free-text amounts)
- Store in localStorage via `DB.set("inventory", data)`
- **AI Integration:** Update `buildCtx()` function (line ~180) to include inventory data, so when the AI generates reports or answers chat questions it knows what you have:
  - "Use your Reef Roids for coral feeding today" (knows you have it)
  - "You're running low on Alk supplement — time to reorder" (sees Low status)
  - "You'll need to buy magnesium supplement" (not in inventory)
- Visual indicators: color-code items by quantity (green = full, yellow = low, red = empty)

### Why:
Recommendations are only useful if they're based on what you actually have. This makes the AI practical instead of generic.

---

## Feature 5: Code Refactor — Better Organization & Maintainability

Right now the entire app lives in one file (`src/App.jsx`, ~839 lines). As we add more features, this will get harder and harder to work with. This refactor breaks the app into smaller, organized files so future changes are much easier.

### What it needs (code-specific):
- **Split into separate component files:**
  - `src/components/DashTab.jsx` — Dashboard
  - `src/components/ParamsTab.jsx` — Water Parameters
  - `src/components/FeedTab.jsx` — Feeding Log
  - `src/components/MaintTab.jsx` — Maintenance Tracker
  - `src/components/DoseTab.jsx` — Dosing Log
  - `src/components/LightTab.jsx` — Lighting Log
  - `src/components/EquipTab.jsx` — Equipment Log
  - `src/components/ChatTab.jsx` — AI Chat
  - `src/components/SetupTab.jsx` — Tank Setup
  - `src/components/SettingsTab.jsx` — Settings (Feature 1)
  - `src/components/InventoryTab.jsx` — Inventory (Feature 4)
- **Move shared code into utility files:**
  - `src/utils/constants.js` — `PARAMS`, `TASKS`, `FOODS`, `DOSES`, `LIGHTS`, `EQUIP`, `DEFAULT_TANK`
  - `src/utils/db.js` — the `DB` localStorage helper
  - `src/utils/ai.js` — the `ai()` function and `buildCtx()` context builder
  - `src/utils/helpers.js` — `tod()`, `fmt()`, `daysAgo()` date helpers
- **Move CSS to a proper stylesheet:**
  - Extract the inline `STYLES` string (lines 13–98) into a `src/styles/app.css` file
  - Remove the runtime style injection `(() => { const s = document.createElement("style")... })()`
  - Import the CSS file normally with `import './styles/app.css'`
- **Clean up `App.jsx`:**
  - Should only contain the main `ReefTracker` component, state management, and tab routing
  - Import everything else from the separate files
  - Should go from ~839 lines down to ~80-100 lines
- **No feature changes** — the app should look and work exactly the same after refactoring

### Why:
A well-organized codebase means: finding things faster, making changes without breaking other stuff, and being able to add new features without the file becoming unmanageable. Since we're about to add 4 new features, doing this first (or as part of implementation) saves a ton of headaches.

---

## Feature 6: Daily Journal

Add a "📝 Journal" tab for free-form daily notes that captures anything not already tracked by existing tabs — observations, mood of the tank, experiments, questions, water clarity, pest sightings, etc.

### What it needs (code-specific):
- New `JournalTab` component in `src/components/JournalTab.jsx`
- Add `["journal","📝 Journal"]` to the `ALL_TABS` array in `App.jsx`
- Add `journal` state + `setJournal` in `ReefTracker()`, loaded from `DB.get("journal")`
- Each entry: `{ date, content, editedAt? }` — date-keyed so there's one entry per day
- **Edit capability:** clicking on a past day's entry opens it for editing (not just adding new)
- Rich-ish text area (multiline textarea, not a full WYSIWYG — keep it simple)
- Calendar-style or list view of past entries so you can browse back
- Quick "today" button to jump to or create today's entry
- **AI Integration:** Update `buildCtx()` in `src/utils/ai.js` to include the last 5-7 journal entries, so the AI can reference your observations when generating reports, answering chat questions, or doing Smart Fill
- Add journal toggle to the Settings tab
- Store via `DB.set("journal", data)`

### Why:
Not everything fits neatly into parameters, feeding, or maintenance. The journal is a catch-all for qualitative observations — and it makes the AI dramatically smarter because it can read "noticed some brown algae on the glass today" or "tank looks extra clear after carbon change" alongside the numbers.

---

## Feature 7: Individual Fish & Coral Profiles

Add a "🐠 Livestock" tab (or sub-section) where each fish and coral can be tracked individually with its own profile, health history, and notes.

### What it needs (code-specific):
- New `LivestockTab` component in `src/components/LivestockTab.jsx`
- Add to `ALL_TABS` array and Settings toggles
- Add `livestock` state + `setLivestock`, loaded from `DB.get("livestock")`
- Each profile: `{ id, type: "fish"|"coral"|"invert", name, species, dateAdded, placement?, status: "healthy"|"stressed"|"sick"|"lost", notes, history: [{ date, note }] }`
- **Add new livestock:** form with name, species, type, date added, optional placement (e.g., "top left rock")
- **Individual profile view:** click on a fish/coral to see its full history
- **Log events per animal:** add dated notes like "eating well", "showing stress coloring", "frag growing new polyps", "moved to new spot"
- **Status tracking:** healthy / stressed / sick / lost — with color coding
- **Photo placeholder:** note where a photo would go (actual photo support covered in Feature 8)
- **AI Integration:** Update `buildCtx()` to include livestock profiles and recent health notes, so the AI can say things like "Your torch coral has been stressed for 3 days — consider checking flow" or "The clownfish you added last week may still be acclimating"
- Cards/grid layout matching the app's existing theme

### Why:
"2 clownfish" in the setup profile isn't enough. Individual tracking lets you monitor health over time, catch problems early, and get AI advice specific to each animal — not just the tank in general.

---

## Feature 8: Photo Support in AI Chat

Allow the user to attach photos in the AI Chat tab so the AI (Gemini) can analyze images of the tank, coral, fish, algae, equipment, etc.

### What it needs (code-specific):
- Update `ChatTab.jsx` to include a photo upload button in the chat bar
- Use `<input type="file" accept="image/*">` to let user select a photo or take one (mobile camera)
- Convert image to base64 for sending to Gemini API
- Update the `ai()` function in `src/utils/ai.js` to support Gemini's multimodal format:
  - Gemini accepts `parts: [{ text: "..." }, { inline_data: { mime_type: "image/jpeg", data: "<base64>" } }]`
  - This is a key advantage of Gemini — it can process images natively
- Show the uploaded image in the chat as a thumbnail within the user's message bubble
- Example use cases:
  - "What's this algae growing on my rock?" + photo
  - "Does my coral look healthy?" + photo
  - "Is this ich on my clownfish?" + photo
  - "Can you identify this hitchhiker?" + photo
- Optional: allow attaching photos to journal entries and livestock profiles too (nice-to-have)

### Why:
A picture is worth a thousand words — especially in reef keeping. Being able to show the AI what you're seeing (algae, coral health, fish behavior, equipment issues) makes the advice far more accurate than text descriptions alone. Gemini supports this natively.

---

## Feature 9: AI Memory & Proactive Questions

Make the AI smarter by giving it persistent memory and the ability to ask clarifying questions, then remember the answers for future conversations.

### What it needs (code-specific):
- New `aiMemory` state + stored via `DB.get("aiMemory")` / `DB.set("aiMemory", data)`
- Memory is an array of `{ date, fact, source }` entries — e.g., `{ date: "2026-03-14", fact: "User prefers to do water changes on Sundays", source: "chat" }`
- **AI asks questions:** Update the AI system prompt in `App.jsx` (for both chat and reports) to instruct the AI:
  - "If you're unsure about something or notice missing information, ask the user a clarifying question."
  - "When the user answers, extract the key fact and include a `[MEMORY: ...]` tag in your response."
- **Memory extraction:** After each AI chat response, parse for `[MEMORY: ...]` tags and auto-save them to `aiMemory`
- **Memory in context:** Update `buildCtx()` to include the last 20-30 memory facts, so the AI always has them
- **Memory management UI:** Small section in Settings or Setup tab showing saved memories with ability to delete incorrect ones
- Example flow:
  1. AI: "I noticed you haven't logged calcium in a while. What test kit do you use for calcium?" `[MEMORY: User hasn't tested calcium recently]`
  2. User: "I use the Salifert calcium test kit"
  3. AI: "Got it! Salifert is very accurate. Based on your last alk reading..." `[MEMORY: User uses Salifert calcium test kit]`
- Over time, the AI builds up a knowledge base about your specific habits, preferences, and setup details that aren't captured in the structured data

### Why:
Right now the AI only knows what's in the structured logs. But there's tons of context it's missing — what test kits you use, your schedule preferences, past problems you've dealt with, your goals. Memory + proactive questions means the AI gets smarter the more you use it, and it never asks you the same thing twice.

---

## Feature 10: Enhanced Parameter Testing — Single-Param Mode & Time Tracking

Upgrade the Parameters tab so you can log a full test OR just a single parameter, and add time-of-day tracking for parameters that fluctuate throughout the day (temp, salinity, pH).

### What it needs (code-specific):
- Update `ParamsTab.jsx` to support two logging modes:
  - **Full Test** (current behavior): log all 9 parameters at once
  - **Quick Test**: select just one (or a few) parameters to log — e.g., just log temperature without filling in the other 8 fields
  - Toggle or tab switch between modes at the top of the form
  - Quick Test shows only the selected parameter input(s) + date + time + notes
- **Time-of-day tracking:**
  - Add a `time` field to parameter entries: `{ date, time?, ...params, notes }`
  - Time input (`<input type="time">`) shown for all entries, but especially important for fluctuating params
  - For existing entries without a time, display as "—" (backward compatible)
- **Time context tags:** Optional quick-select chips for context alongside the time:
  - "Morning", "Midday", "Evening", "Night"
  - "Lights On", "Lights Off", "Peak Light"
  - "Pre-Feed", "Post-Feed"
  - "Post Water Change"
  - These get stored as a `context` field on the entry, giving the AI richer data
- **Chart improvements:**
  - When multiple readings exist for the same day (e.g., morning vs. evening temp), show them as separate points on the chart instead of overwriting
  - X-axis should use date+time for sorting when time data is available
  - Tooltip should show time and context tags if present
- **History display updates:**
  - Show time next to date in history entries (e.g., "Mar 14, '26 · 8:30 AM · Morning, Pre-Feed")
  - Show context tags as small colored chips
- **AI Integration:** Update `buildCtx()` to include time and context when available:
  - Instead of `[2026-03-14] Temp:77.8` it becomes `[2026-03-14 08:30 Morning/Pre-Feed] Temp:77.8`
  - This lets the AI correlate: "Your pH drops 0.2 between lights-on and lights-off, which is normal" or "Temperature runs 1°F higher in the afternoon — your heater may be overshooting"

### Why:
Right now you can only log all 9 parameters at once, which discourages quick spot-checks. If you just want to check the temp before bed, you shouldn't have to fill in calcium and magnesium too. And without time tracking, you're missing crucial context — pH naturally swings between day and night, temperature fluctuates with lighting and room temp, and salinity can shift with evaporation. Time + context tags let the AI see patterns like "pH always dips at night" or "temp spikes after feeding" that are invisible with just daily snapshots.

---

## Bugs to Investigate
- (None identified yet — will note any found during implementation)

## Content/Data Changes
- (None identified yet — will note any needed during implementation)

---

## Implementation Status

### Completed (Features 1–5)
1. ✅ **Feature 5: Code Refactor** — Split into 15 files across components/, utils/, styles/
2. ✅ **Feature 4: Supply Inventory** — New 📦 Inventory tab with categories, quantity tracking, AI integration
3. ✅ **Feature 1: Settings Page** — New 🛠️ Settings tab with toggle switches for all feature tabs
4. ✅ **Feature 2: AI Smart Fill** — ✨ Smart Fill button on Feeding, Dosing, and Maintenance tabs
5. ✅ **Feature 3: Gemini API Switch** — AI now uses Google Gemini 2.0 Flash, Setup tab updated

### Next Up (Features 6–10)
6. Feature 6: Daily Journal (free-form notes + AI context)
7. Feature 7: Individual Fish & Coral Profiles (per-animal tracking)
8. Feature 8: Photo Support in AI Chat (multimodal Gemini)
9. Feature 9: AI Memory & Proactive Questions (persistent AI knowledge)
10. Feature 10: Enhanced Parameters (single-param mode + time tracking)
11. Test all changes locally with `npm run dev`
12. Build with `npm run build` and redeploy to Vercel
