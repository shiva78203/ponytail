// Truth model for the energy-meter figure. Pure: the build and the live page both use it.

export const V_LN = 230; // volts, line to neutral
export const PF = 0.9; // cos φ
export const CT = [400, 5]; // primary / secondary amps
export const START_WH = 258394680; // 258.39468 MWh, the worked example in the energy-meter skill

// Total three-phase active power in watts for a balanced primary current per phase.
export function powerW(amps) {
  return 3 * V_LN * amps * PF;
}

// What the meter's second and third rows show for a running total in Wh.
// ponytail: range rule is this figure's: K up to 9999.9999 kWh, then M; a real meter's switch point may differ.
export function displayOf(wh) {
  const kwh = wh / 1000;
  const lamp = kwh < 10000 ? "K" : "M";
  const value = lamp === "K" ? kwh : kwh / 1000;
  const whole = Math.max(1, String(Math.floor(value)).length);
  const places = 8 - whole;
  const digits = (Math.floor(value * 10 ** places + 1e-6) % 1e8).toString().padStart(8, "0");
  const point = whole - 1; // index of the digit the decimal point follows
  return { lamp, digits, point, value: digits.slice(0, whole) + "." + digits.slice(whole) };
}
