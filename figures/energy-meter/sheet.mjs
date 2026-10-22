const part = (id) => `[data-part="${id}"]`;
const still = [["eval", "(window.__meterStill(300), true)"], ["wait", 400]];

export default {
  page: "energy-meter-light.html",
  out: "energy-meter",
  layers: ".iso-stage > svg",
  reduced: true,
  views: { rest: { actions: still } },

  name: "Energy meter",
  title: "Energy meter: from bus bar to units",
  number: "EM-001",
  tagline: "Volts times amps, added up",
  question: "How do you read the units on this meter?",
  lead: "CTs and taps bring each phase's current and voltage in; the metering chip multiplies them into power and the MCU adds it up into Wh. Rows 2 and 3 of the window are one 8-digit number, and the lit K or M lamp gives kWh or MWh.",
  quote: "Rows 2 + 3 are one number",
  numbers: [
    ["258.39468", "MWh", "on the window"],
    ["2,58,394.68", "units", "the same in kWh"],
    ["400 : 5", "", "CT ratio"],
    ["186.3", "kW", "at 300 A per phase"],
  ],
  spec: [
    ["Supply", "3 phase, 4 wire, 230 V L–N"],
    ["CTs", "400 : 5 on the bars"],
    ["Power factor", "0.9 (figure's model)"],
    ["Display", "3 rows × 4 digits, K and M lamps"],
    ["Range", "K up to 9999.9999 kWh, then M (figure's rule)"],
  ],
  why: {
    title: "Why two rows?",
    text: "Four digits can't hold both a large total and fine steps. Rows 2 and 3 joined make eight digits, so 258.39468 MWh shows the whole total down to 10 Wh, and the lamp says whether it is kWh or MWh.",
  },

  parts: [
    { id: "bars", name: "Bus bars and taps", say: "L1 L2 L3 carry the load; taps send 230 V.", select: `${part("bars")}, ${part("taps")}` },
    { id: "ct", name: "External CTs 400 : 5", say: "Step bar current down to 0–5 A.", select: part("ct") },
    { id: "terminals", name: "Terminal block", say: "I1–I3′ take the CT loops, V1–VN the voltages.", select: part("terminals") },
    { id: "toroids", name: "Internal CTs, divider", say: "Scale current and voltage down for the chip.", select: `${part("toroids")}, ${part("divider")}` },
    { id: "ic", name: "Metering IC", say: "Works out P = V × I × cos φ, three phases.", select: part("ic") },
    { id: "mcu", name: "MCU, crystal, EEPROM", say: "Add power over time into Wh and keep it.", select: part("mcu"), at: [273, 279] },
    { id: "psu", name: "Power supply", say: "Transformer and capacitors run the meter.", select: part("psu"), at: [281, 313] },
    { id: "display", name: "Display board", say: "Carries the total to the three LED rows.", select: part("display"), at: [251, 229] },
    { id: "window", name: "Window and keys", say: "Wh row, 8-digit energy, K/M lamps; keys page.", select: `${part("window")}, ${part("keys")}` },
    { id: "taps", select: part("taps") },
    { id: "divider", select: part("divider") },
    { id: "leads", select: part("leads") },
    { id: "row0", select: '[data-row="0"]:not([data-lamp])' },
    { id: "row1", select: '[data-row="1"]:not([data-lamp])' },
    { id: "row2", select: '[data-row="2"]:not([data-lamp])' },
    { id: "lamps", select: '[data-row="1"][data-lamp], [data-row="2"][data-lamp]' },
  ],

  main: { view: "rest" },
  inset: { label: "The window", view: "rest", crop: [175, 225, 140, 190] },
  steps: [
    { view: "rest", title: "CTs step down", text: "Each bar passes through a 400 : 5 CT, so 300 A in the bar is 3.75 A in its two wires.", focus: ["bars", "ct"] },
    { view: "rest", title: "Voltage tapped", text: "A lug on each bar, and on neutral, sends 230 V to the V terminals.", focus: ["taps", "terminals"] },
    { view: "rest", title: "Scaled for the chip", text: "Inside, small CTs take the current down to milliamps and a divider takes 230 V down to a fraction of a volt.", focus: ["toroids", "divider", "leads"] },
    { view: "rest", title: "Power is worked out", text: "The metering IC multiplies V × I × cos φ for all three phases: 3 × 230 × 300 × 0.9 = 186.3 kW.", focus: ["ic"] },
    { view: "rest", title: "Energy is counted", text: "The MCU adds power over time into Wh and the EEPROM keeps it through a power cut, so it only goes up.", focus: ["mcu", "display"] },
    { view: "rest", title: "1 · Top row is Wh", text: "Wh is active energy, the billing value. VAh or VARh would not be units.", focus: ["row0"] },
    { view: "rest", title: "2 · Read row 2", text: "Exactly as shown, point included: 258.3.", focus: ["row1"] },
    { view: "rest", title: "3 · Add row 3", text: "Write it straight after: 258.3 and 9468 make 258.39468.", focus: ["row1", "row2"] },
    { view: "rest", title: "4 · K or M lamp", text: "M is lit, so it is 258.39468 MWh. K would mean kWh.", focus: ["lamps"] },
    { view: "rest", title: "5 · Convert to units", text: "MWh × 1000 = 258,394.68 kWh, which is 2,58,394.68 units. Count only bright segments.", focus: ["row1", "row2", "lamps"] },
  ],
  details: [
    { view: "rest", title: "The window", text: "Wh on top; rows 2 and 3 are one number; the lit lamp gives the unit.", around: ["window"], focus: ["row1", "row2", "lamps"] },
    { view: "rest", title: "The CTs", text: "Each bar passes through a ring CT; S1 and S2 wires run to the meter.", around: ["ct"], focus: ["ct"] },
    { view: "rest", title: "The board", text: "Internal CTs and divider feed the metering IC; the MCU counts.", around: ["toroids", "ic"], focus: ["toroids", "divider", "ic", "mcu"] },
  ],
};
