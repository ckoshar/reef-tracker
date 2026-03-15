export const PARAMS = [
  { key:"temp",     label:"Temp °F",     ideal:"76–79",      color:"#f97316", min:74, max:82 },
  { key:"salinity", label:"Salinity",    ideal:"1.025–1.026",color:"#38bdf8", min:1.02, max:1.03 },
  { key:"ph",       label:"pH",          ideal:"8.1–8.3",    color:"#a78bfa", min:7.8, max:8.5 },
  { key:"ammonia",  label:"Ammonia",     ideal:"0",          color:"#f43f5e", min:0, max:1 },
  { key:"nitrite",  label:"Nitrite",     ideal:"0",          color:"#fb923c", min:0, max:1 },
  { key:"nitrate",  label:"Nitrate ppm", ideal:"<5",         color:"#facc15", min:0, max:40 },
  { key:"calcium",  label:"Calcium",     ideal:"380–430",    color:"#34d399", min:300, max:500 },
  { key:"alk",      label:"Alk dKH",     ideal:"8–10",       color:"#60a5fa", min:6, max:13 },
  { key:"mag",      label:"Magnesium",   ideal:"1250–1350",  color:"#c084fc", min:1100, max:1500 },
];

export const TASKS = [
  { id:"glass",    label:"Glass Cleaning",       icon:"🪟", every:3  },
  { id:"wchange",  label:"Water Change",          icon:"💧", every:7  },
  { id:"ato",      label:"ATO Reservoir Refill",  icon:"🪣", every:3  },
  { id:"skimmer",  label:"Skimmer Cleaning",      icon:"🫧", every:7  },
  { id:"return",   label:"Return Pump Cleaning",  icon:"⚙️", every:30 },
  { id:"phead",    label:"Powerhead Cleaning",    icon:"🌀", every:30 },
  { id:"filter",   label:"Filter Media Change",   icon:"🗂️", every:14 },
  { id:"sump",     label:"Sump Cleaning",         icon:"🧹", every:30 },
  { id:"saltmix",  label:"Mix Saltwater",         icon:"🧂", every:7  },
  { id:"lights",   label:"Light Schedule Check",  icon:"💡", every:30 },
  { id:"equip",    label:"Equipment Inspection",  icon:"🔍", every:14 },
  { id:"coral",    label:"Coral/Stock Inspect",   icon:"🪸", every:1  },
];

export const FOODS  = ["Pellets","Flake","Frozen Mysis","Frozen Brine","Live Brine","Copepods","Coral Food","NLS Thera A","Other"];
export const DOSES  = ["Two Part A","Two Part B","Calcium","Alkalinity","Magnesium","Iodide","Strontium","Reef Energy","Bacteria/Probiotic","Other"];
export const LIGHTS = ["Schedule Check","Bulb Replacement","Intensity Adjusted","Added/Removed Fixture","Noted Coral Response","Other"];
export const EQUIP  = ["Heater Check","Return Pump","Powerhead","Protein Skimmer","ATO Unit","Sump","Temperature Probe","Salinity Probe","Other Equipment"];

export const INVENTORY_CATEGORIES = [
  { key: "food", label: "Food", icon: "🐡", color: "#34d399" },
  { key: "salt", label: "Salt Mix", icon: "🧂", color: "#38bdf8" },
  { key: "chemicals", label: "Chemicals & Additives", icon: "💊", color: "#c084fc" },
  { key: "consumables", label: "Equipment/Consumables", icon: "🔧", color: "#f97316" },
];

export const QUANTITY_LEVELS = [
  { value: "full", label: "Full", color: "#34d399" },
  { value: "three_quarter", label: "¾", color: "#6ee7b7" },
  { value: "half", label: "Half", color: "#fbbf24" },
  { value: "low", label: "Low", color: "#f97316" },
  { value: "empty", label: "Empty", color: "#f43f5e" },
];

export const DEFAULT_TANK = {
  name:"My Reef Tank", size:"20 gallon",
  heater:"100W Titanium + Controller",
  fish:"2x Ocellaris Clownfish, 2x Banggai Cardinals, 1x Yellow Watchman Goby",
  inverts:"5x Blue Leg Hermit Crabs, 1x Cleaner Shrimp",
  coral:"None yet (new tank)",
  equipment:"Titanium heater with controller. Temperature probe on opposite side from heater.",
  lighting:"",
  notes:"New tank. Working on establishing coralline algae.",
};

export const TIME_CONTEXTS = [
  "Morning", "Midday", "Evening", "Night",
  "Lights On", "Lights Off", "Peak Light",
  "Pre-Feed", "Post-Feed",
  "Post Water Change",
];

export const DEFAULT_SETTINGS = {
  params: true,
  feed: true,
  maint: true,
  dose: true,
  light: true,
  equip: true,
  chat: true,
  inventory: true,
  journal: true,
  livestock: true,
};
